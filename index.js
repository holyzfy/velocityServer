var config = require('config');
var express = require('express');
var finalhandler = require('finalhandler');
var read = require('read-file');
var async = require('async');
var debug = require('debug')('velocityServer:index.js');
var Velocity = require('velocityjs');

var startServer = function(callback) {
    var app = express();
    
    // TODO

    app.listen(config.port, callback);
};

startServer(function() {
    console.log('Server is running on port', config.port);
});

module.exports = {
    _debug: {

    }
}
