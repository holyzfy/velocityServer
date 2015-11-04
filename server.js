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
    // debug(req.path, 'isVm=', isVm);
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
    var templateFile = new File({path: vmPath});
    var contextFile = new File({path: vmPath});
    contextFile.extname = '.js';

    var template = getFileContent(vmPath);
    if(template === null) {
        return callback('File not found:', vmPath);
    }

    var html = '';
    var context;
    try {
        delete require.cache[require.resolve(contextFile.path)];
        context = require(contextFile.path);
    } catch(e) {}
    templateFile.contents = new Buffer(template);

    for(var key in replaceSSI.reg) {
        template = replaceSSI(templateFile, replaceSSI.reg[key], config.ssiMaxDepth);
        var isMacro = ['macroParse', 'macroInclude'].indexOf(key) >= 0;
        html = isMacro ? Velocity.render(template, context, macros) : template;
        templateFile.contents = new Buffer(html);
    }

    callback(null, html);
}

function getFileContent(filePath) {
    var content = null;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch(e) {}
    return content;
}

function replaceSSI(vmFile, reg, maxDepth) {
    var file = new File({
        path: vmFile.path,
        contents: new Buffer(vmFile.contents.toString())
    });
    var hasSSI = reg.test(file.contents.toString());
    if(maxDepth <= 0 || !hasSSI) {
        return file.contents.toString();
    }
    return file.contents.toString().replace(reg, function(match, subPath) {
        var newFilePath = path.resolve(path.dirname(file.path), subPath);
        var contents = getFileContent(newFilePath);
        if(contents) {
            var newFile = new File({
                path: newFilePath,
                contents: new Buffer(contents)
            });
            return replaceSSI(newFile, reg, --maxDepth);
        } else {
            return '<!-- ERROR: {{module}} not found -->'.replace('{{module}}', subPath);
        }
    });
}

replaceSSI.reg = {
    macroParse: /\#parse\(\s*"([^"]*)"\s*\)/gm,
    macroInclude: /\#include\(\s*"([^"]*)"\s*\)/gm,
    ssiInclude: /<\!--\\?#include\s+(?:virtual|file)="([^"]*)"\s*-->/gm
};

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
