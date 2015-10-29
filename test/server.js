var expect = require('expect.js');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var server = require('../server.js');

describe(__filename, function(){
    it('getExtname', function() {
        var extname = server._debug.getExtname('path/to/list.vm');
        expect(extname).to.be('.vm');
    });


    it('parseVm: this is not a vm file', function() {
        var req = {
            originalUrl: '/demo/index.xxx'
        };
        var next = sinon.spy();
        server._debug.parseVm(req, null, next);
        expect(next.called).to.be.ok();
    });

    it('parseVm: this is a vm file', function() {
        var req = {
            originalUrl: '/demo/index.vm'
        };
        var next = sinon.spy();
        server._debug.parseVm(req, null, next);
        expect(next.called).to.not.be.ok();
    });

    /*it('compile', function(done) {
        server._debug.compile('/demo/index.vm', function(err, ret) {
            // expect(ret.extname).to.be('.json');
            // done();
        });
    });*/

it('getFileContent', function(done) {
    server._debug.getFileContent('/file/not/existed', function(err, content) {
        expect(content).not.be.ok();
        done();
    });
});


});