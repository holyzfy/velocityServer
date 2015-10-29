var expect = require('expect.js');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var path = require('path');
var server = require('../server.js');

describe(__filename, function(){
    it('getExtname', function() {
        var extname = server._debug.getExtname('path/to/list.vm');
        expect(extname).to.be('.vm');
    });


    it('parseVm: this is not a vm file', function() {
        var req = {
            path: 'path/to/demo/index.xxx'
        };
        var next = sinon.spy();
        server._debug.parseVm(req, null, next);
        expect(next.called).to.be.ok();
    });

    it('parseVm: this is a vm file', function() {
        var req = {
            path: 'path/to/demo/index.vm'
        };
        var next = sinon.spy();
        server._debug.parseVm(req, null, next);
        expect(next.called).to.not.be.ok();
    });

    it('compile', function(done) {
        var vmPath = path.join(__dirname, 'testcase/index.vm');
        server._debug.compile(vmPath, function(err, ret) {
            expect(ret).to.be('<h1>hello world</h1>');
            done();
        });
    });

it('getFileContent', function(done) {
    server._debug.getFileContent('/file/not/existed', function(err, content) {
        expect(content).not.be.ok();
        done();
    });
});


});