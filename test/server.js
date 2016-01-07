var expect = require('expect.js');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var path = require('path');
var Velocity = require('velocityjs');
var server = proxyquire('../server.js', {
    config: {
        webapps: __dirname
    },
    express: function() {
        return {
            set: sinon.spy(),
            use: sinon.spy(),
            post: sinon.spy(),
            listen: sinon.stub().callsArg(1),
            static: sinon.spy()
        }
    },
    finalhandler: sinon.stub().returns(sinon.spy())
});
var File = require('vinyl');

describe(__filename, function(){
    it('getExtname', function() {
        var extname = server._debug.getExtname('path/to/list.vm');
        expect(extname).to.be('.vm');
    });

    it('getFileContent: file is not existed', function() {
        var content = server._debug.getFileContent('/file/not/existed');
        expect(content).to.not.be.ok();
    });

    it('getFileContent: file is existed', function() {
        var vmPath = path.join(__dirname, 'testcase/hello.vm');        
        var content = server._debug.getFileContent(vmPath);
        expect(content).to.be('<h1>${title}</h1>');
    });

    it('getMacros', function() {
        var vmPath = path.join(__dirname, 'testcase/list.vm');
        var vm = server._debug.getFileContent(vmPath);
        var context = null;
        var macros = server._debug.getMacros(vmPath);
        var ret = Velocity.render(vm, context, macros);
        
        var contentPath = path.join(__dirname, 'testcase/list_expect.html');
        var content = server._debug.getFileContent(contentPath);

        expect(ret).to.be(content);
    });

    it('getMacros: unparsed', function() {
        var vmPath = path.join(__dirname, 'testcase/unparsed.vm');
        var vm = server._debug.getFileContent(vmPath);
        var macros = server._debug.getMacros(vmPath);
        var context = null;
        var ret = Velocity.render(vm, context, macros);
        
        var contentPath = path.join(__dirname, 'testcase/unparsed.html');
        var content = server._debug.getFileContent(contentPath);

        expect(ret).to.be(content);
    });

    it('ssiInclude.reg', function() {
        var pattern = server._debug.ssiInclude.reg;
        var vm = '<!--#include virtual="inc/header.vm" -->';
        expect(vm.match(pattern)).to.have.length(1);

        vm = '<!--#include file="inc/header.vm" -->';
        expect(vm.match(pattern)).to.have.length(1);

        vm = '<!--#include file="inc/header.vm"-->';
        expect(vm.match(pattern)).to.have.length(1);

        vm = '<!--\\#include file="inc/header.vm" -->';
        expect(vm.match(pattern)).to.have.length(1);

        vm = '<!-- #include file="inc/header.vm"-->';
        expect(vm.match(pattern)).to.be(null);
    });

    it('ssi', function() {
        var vmPath = path.join(__dirname, 'testcase/result.vm');
        var vm = server._debug.getFileContent(vmPath);
        var ret = server._debug.ssiInclude(vm, vmPath);

        var contentPath = path.join(__dirname, 'testcase/result_expect.html');
        var content = server._debug.getFileContent(contentPath);

        expect(ret).to.be(content);
    });

    it('compile', function(done) {
        var vmPath = path.join(__dirname, 'testcase/index.vm');
        var contentPath = path.join(__dirname, 'testcase/index_expect.html');
        var content = server._debug.getFileContent(contentPath);
        server._debug.compile(vmPath, function(err, ret) {
            expect(ret).to.be(content);
            done();
        });
    });

    it('compile: file not found', function(done) {
        var vmPath = '/path/to/not/existed';
        server._debug.compile(vmPath, function(err) {
            expect(err).to.be('File not found:' + vmPath);
            done();
        });
    });

    it('parseVm: this is not a vm file', function() {
        var req = {
            path: 'path/to/demo/index.xxx'
        };
        var res = {
            set: sinon.spy(),
            send: sinon.spy()
        };
        var next = sinon.spy();
        server._debug.parseVm(req, res, next);
        expect(next.called).to.be.ok();
    });

    it('parseVm: this is a vm file', function() {
        var req = {
            path: 'testcase/index.vm'
        };
        var res = {
            set: sinon.spy(),
            send: sinon.spy()
        };
        var next = sinon.spy();
        server._debug.parseVm(req, res, next);
        expect(next.called).to.not.be.ok();
    });

    it('errorHandler', function() {
        expect(server._debug.errorHandler).to.not.throwException();
    });

    it('json: file is existed', function() {
        var req = {
            path: 'testcase/result.json'
        };
        var res = {
            set: sinon.spy(),
            send: sinon.spy()
        };
        var next = sinon.spy();
        server._debug.json(req, res, next);
        expect(res.send.called).to.be.ok();
    });

    it('json: file is empty', function() {
        var req = {
            path: 'testcase/empty.json'
        };
        var res = {
            set: sinon.spy(),
            send: sinon.spy()
        };
        var next = sinon.spy();
        server._debug.json(req, res, next);
        expect(res.send.called).to.be.ok();
    });

    it('json: file is not existed', function() {
        var req = {
            path: '/file/not/existed'
        };
        var res = {
            set: sinon.spy(),
            send: sinon.spy()
        };
        var next = sinon.spy();
        server._debug.json(req, res, next);
        expect(next.called).to.be.ok();
    });

    it('start', function() {
        var callback = sinon.spy();
        server.start(callback);
        expect(callback.called).to.be(true);
    });

});