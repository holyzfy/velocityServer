var config = require('config');
var express = require('express');
var finalhandler = require('finalhandler');
var serveIndex = require('serve-index');
var async = require('async');
var debug = require('debug')('velocityServer:index.js');
var Velocity = require('velocityjs');
var File = require('vinyl');

function getExtname(filePath) {
    return (new File({path: filePath})).extname;
}

function render(path, options, fn) {
    fs.readFile(path, 'utf8', function(err, content){
        if(err) {
            return fn(err);
        }
        
        // TODO 渲染vm
        
        fn(null, content);
    });
}

function parseVm(req, res, next) {
    // TODO
    next();
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
    config.vm.forEach(function(item) {
        app.engine(item, render);
    });

    app.use(parseVm);
    app.use(serveIndex(config.webapps, {icons: true}));
    app.use(express.static(config.webapps, {index: false, maxAge: 0}));
    app.use(errorHandler);

    app.listen(config.port, callback);
}

module.exports = {
    _debug: {
        getExtname: getExtname
    },
    start: start
}
