var config = require('config');
var server = require('./server.js');

server.start(function() {
    console.log('Server is running on port', config.port);
});