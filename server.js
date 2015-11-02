var config = require('config');
var express = require('express');
var finalhandler = require('finalhandler');
var serveIndex = require('serve-index');
var async = require('async');
var debug = require('debug')('velocityServer:index.js');
var Velocity = require('velocityjs');
var File = require('vinyl');
var path = require('path');
var fs = require('fs');

function getExtname(filePath) {
    return (new File({path: filePath})).extname;
}

function parseVm(req, res, next) {
    var isVm = config.vm.indexOf(getExtname(req.path)) >= 0;
    debug(req.path, 'isVm=', isVm);
    if(!isVm) {
        return next();
    }
    
    var vmPath = path.join(config.webapps, req.path);    
    compile(vmPath, function(err, ret) {
        if(err) {
            return next(err);
        }
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(ret);
    });
}

function compile(vmPath, macros, callback) {
    callback = arguments[arguments.length - 1];
    var contextFile = new File({path: vmPath});
    contextFile.extname = '.js';

    var template = getFileContent(vmPath);
    if(template === null) {
        return callback('File not found:', vmPath);
    }
    var context = require(contextFile.path);
    var html = Velocity.render(template, context, macros);
    callback(null, html);
}

function getFileContent(filePath) {
    var content = null;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch(e) {}
    return content;
}

function replaceSSI(file, reg, maxDepth) {
    if(maxDepth <= 0) {
        return file.contents.toString();
    }
    var contents = file.contents.toString().replace(reg, function(match, subPath) {
        file.path = path.resolve(path.dirname(file.path), subPath);
        debug(subPath, file.path);
        return getFileContent(file.path) || match;
    });
    debug(maxDepth, 'contents=', contents);

    file.contents = new Buffer(contents);
    return replaceSSI(file, reg, --maxDepth);
}

function errorHandler(err, req, res, next) {
    var options = {
        message: true
    };
    finalhandler(req, res, options)();
};

function start(callback) {
    if(!config.webapps) {
        return console.error('请配置服务器根目录 config.webapps');
    }

    var app = express();
    
    app.set('views', config.webapps);
    app.use(parseVm);
    app.use(serveIndex(config.webapps, {icons: true}));
    app.use(express.static(config.webapps, {index: false, maxAge: 0}));
    app.use(errorHandler);

    app.listen(config.port, callback);
}

module.exports = {
    _debug: {
        getExtname: getExtname,
        parseVm: parseVm,
        compile: compile,
        getFileContent: getFileContent,
        replaceSSI: replaceSSI
    },
    start: start
}
