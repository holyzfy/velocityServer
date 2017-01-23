var config = require('config');
var express = require('express');
var serveIndex = require('serve-index');
var debug = require('debug')('velocityServer:server.js');
var Velocity = require('velocityjs');
var File = require('vinyl');
var path = require('path');
var fs = require('fs');
var JSON5 = require('json5');

function getExtname(filePath) {
    return (new File({path: filePath})).extname;
}

function parseVm(req, res, next) {
    var isVm = config.vm.indexOf(getExtname(req.path)) >= 0;
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
    var vmFile = new File({path: vmPath});
    var contextFile = new File({path: vmPath});
    contextFile.extname = '.js';

    var template = getFileContent(vmPath);
    if(null === template) {
        var err = new Error('File not found:' + vmPath);
        err.status = 404;
        return callback(err);
    }
    vmFile.contents = new Buffer(template);
    var context;
    try {
        delete require.cache[require.resolve(contextFile.path)];
        context = require(contextFile.path);
    } catch(err) {}

    try {
        var html = Velocity.render(template, context, getMacros(vmFile.path));
        html = ssiInclude(html, vmFile.path);
        callback(null, html);
    } catch(err) {
        return callback(err);
    }
}

function getMacros(relativePath) {
    var ssi = function(filePath) {
        var newFilePath = path.resolve(path.dirname(relativePath), filePath);
        var content = getFileContent(newFilePath);
        if(null === content) {
            return '<!-- ERROR: {{module}} not found -->'.replace('{{module}}', filePath);
        }

        return this.eval(content);
    };

    return {
        include: ssi,
        parse: ssi
    };
}

function ssiInclude(content, relativePath) {
    return content.replace(ssiInclude.reg, function(match, filePath) {
        var newFilePath = path.resolve(path.dirname(relativePath), filePath);
        var content = getFileContent(newFilePath);
        if(content === null) {
            return '<!-- ERROR: {{module}} not found -->'.replace('{{module}}', filePath);
        } else if(ssiInclude.reg.test(content)) {
            return ssiInclude(content, newFilePath);
        } else {
            return content;
        }     
    });
}
ssiInclude.reg = /<\!--\\?#include\s+(?:virtual|file)="([^"]*)"\s*-->/gm;

function getFileContent(filePath) {
    var content = null;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch(e) {}
    return content;
}

function json(req, res, next) {
    var filePath = path.join(config.webapps, req.path);
    var content = getFileContent(filePath);

    if(null === content) {
        next();
    } else {
        try {
            content = JSON.stringify(JSON5.parse(content), null, 4);
        } catch (err) {
            return next(err);
        }

        res.set({
            'Content-Type': 'application/json',
            'maxAge': 0
        });
        res.send(content);
    }
};

function start(callback) {
    if(!config.webapps) {
        return callback(new Error('Error: config.webapps is missing, Please set it in config/local.json file.'));
    }

    var app = express();
    
    app.set('views', config.webapps);
    app.use(function(req, res, next) {
        res.set(config.responseHeaders);
        next();
    });
    app.use(parseVm);
    app.all('*.json5?', json);
    app.use(serveIndex(config.webapps, {icons: true}));
    app.use(express.static(config.webapps, {index: false, maxAge: 0}));
    app.use(function errorHandler(err, req, res, next) {
        res.status(err.status || 500).send(err.message);
    });

    app.listen(config.port, callback);
}

module.exports = {
    _debug: {
        getExtname: getExtname,
        parseVm: parseVm,
        compile: compile,
        getMacros: getMacros,
        ssiInclude: ssiInclude,
        getFileContent: getFileContent,
        json: json
    },
    start: start
}
