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

function compile(vmPath, callback) {
    var contextFile = new File({path: vmPath});
    contextFile.extname = '.json';

    async.map([vmPath, contextFile.path], getFileContent, function(err, results) {
        var template = results[0];
        if(template === null) {
            return callback('文件未找到');
        }
        var context = JSON.parse(results[1]);
        var html = Velocity.render(template, context);
        callback(null, html);
    });
}

function getFileContent(filePath, callback) {
    fs.readFile(filePath, 'utf8', function(err, content){
        callback(null, content || null);
    });
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
        getFileContent: getFileContent
    },
    start: start
}
