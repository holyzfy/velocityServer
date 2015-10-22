var expect = require('expect.js');
var proxyquire = require('proxyquire');
var server = require('../server.js');

describe(__filename, function(){
    it('getExtname', function() {
        var extname = server._debug.getExtname('path/to/list.vm');
        expect(extname).to.be('.vm');
    });


});