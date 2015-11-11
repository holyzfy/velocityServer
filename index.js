var config = require('config');
var colors = require('colors');
var server = require('./server.js');

server.start(function(err) {
    if(err) {
        return console.error(colors.red(err.message));
    }
    console.log(colors.green('Server is running on port', config.port));
});