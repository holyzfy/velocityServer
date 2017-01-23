var tape = require('tape');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var path = require('path');
var fs = require('fs');
var Velocity = require('velocityjs');
var server = proxyquire('../server.js', {
    config: {
        webapps: __dirname
    },
    express: function() {
        return {
            all: sinon.spy(),
            set: sinon.spy(),
            use: sinon.spy(),
            post: sinon.spy(),
            listen: sinon.stub().callsArg(1),
            static: sinon.spy()
        }
    }
});
var File = require('vinyl');
var http = require('http');

tape('getExtname', function(test) {
    var extname = server._debug.getExtname('path/to/list.vm');
    test.equal(extname, '.vm');
    test.end();
});

tape('getFileContent: file is not existed', function(test) {
    var content = server._debug.getFileContent('/file/not/existed');
    test.notOk(content);
    test.end();
});

tape('getFileContent: file is existed', function(test) {
    var vmPath = path.join(__dirname, 'testcase/hello.vm');        
    var content = server._debug.getFileContent(vmPath);
    test.equal(content, '<h1>${title}</h1>');
    test.end();
});

tape('getMacros', function(test) {
    var vmPath = path.join(__dirname, 'testcase/list.vm');
    var vm = server._debug.getFileContent(vmPath);
    var context = null;
    var macros = server._debug.getMacros(vmPath);
    var ret = Velocity.render(vm, context, macros);
    
    var contentPath = path.join(__dirname, 'testcase/list_expect.html');
    var content = server._debug.getFileContent(contentPath);

    test.equal(ret, content);
    test.end();
});

tape('getMacros: unparsed', function(test) {
    var vmPath = path.join(__dirname, 'testcase/unparsed.vm');
    var vm = server._debug.getFileContent(vmPath);
    var macros = server._debug.getMacros(vmPath);
    var context = null;
    var ret = Velocity.render(vm, context, macros);
    
    var contentPath = path.join(__dirname, 'testcase/unparsed.html');
    var content = server._debug.getFileContent(contentPath);

    test.equal(ret, content);
    test.end();
});

tape('getMacros: module not found', function(test) {
    var vmPath = 'module/not/existed';
    var content = server._debug.getMacros('/').include(vmPath);
    test.equal(content, '<!-- ERROR: module/not/existed not found -->');
    test.end();
});

tape('ssiInclude.reg', function(test) {
    var pattern = server._debug.ssiInclude.reg;
    var vm = '<!--#include virtual="inc/header.vm" -->';
    test.equal(vm.match(pattern).length, 1);

    vm = '<!--#include file="inc/header.vm" -->';
    test.equal(vm.match(pattern).length, 1);

    vm = '<!--#include file="inc/header.vm"-->';
    test.equal(vm.match(pattern).length, 1);

    vm = '<!--\\#include file="inc/header.vm" -->';
    test.equal(vm.match(pattern).length, 1);

    vm = '<!-- #include file="inc/header.vm"-->';
    test.equal(vm.match(pattern), null);

    test.end();
});

tape('ssi', function(test) {
    var vmPath = path.join(__dirname, 'testcase/result.vm');
    var vm = server._debug.getFileContent(vmPath);
    var ret = server._debug.ssiInclude(vm, vmPath);

    var contentPath = path.join(__dirname, 'testcase/result_expect.html');
    var content = server._debug.getFileContent(contentPath);

    test.equal(ret, content);
    test.end();
});

tape('compile', function(test) {
    var vmPath = path.join(__dirname, 'testcase/index.vm');
    var contentPath = path.join(__dirname, 'testcase/index_expect.html');
    var content = server._debug.getFileContent(contentPath);
    server._debug.compile(vmPath, function(err, ret) {
        test.equal(ret, content);
        test.end();
    });
});

tape('compile: file not found', function(test) {
    var vmPath = '/path/to/not/existed';
    server._debug.compile(vmPath, function(err) {
        test.equal(err.status, 404);
        test.end();
    });
});

tape('parseVm: this is not a vm file', function(test) {
    var req = {
        path: 'path/to/demo/index.xxx'
    };
    var res = {
        set: sinon.spy(),
        send: sinon.spy()
    };
    var next = sinon.spy();
    server._debug.parseVm(req, res, next);
    test.ok(next.called);
    test.end();
});

tape('parseVm: this is a vm file', function(test) {
    var req = {
        path: 'testcase/index.vm'
    };
    var res = {
        set: sinon.spy(),
        send: sinon.spy()
    };
    var next = sinon.spy();
    server._debug.parseVm(req, res, next);
    test.notOk(next.called);
    test.end();
});

tape('json: file is existed', function(test) {
    var req = {
        path: 'testcase/result.json'
    };
    var res = {
        set: sinon.spy(),
        send: sinon.spy()
    };
    server._debug.json(req, res, sinon.spy());
    test.ok(res.send.called);
    test.end();
});

tape('json: file is empty', function(test) {
    var req = {
        path: 'testcase/empty.json'
    };
    var res = {
        set: sinon.spy(),
        send: sinon.spy()
    };
    var next = sinon.spy();
    server._debug.json(req, res, next);
    test.ok(next.called);
    test.end();
});

tape('json: file is not existed', function(test) {
    var req = {
        path: '/file/not/existed'
    };
    var res = {
        set: sinon.spy(),
        send: sinon.spy()
    };
    var next = sinon.spy();
    server._debug.json(req, res, next);
    test.ok(next.called);
    test.end();
});

tape('json: valid json5', function (test) {
    var req = {
        path: 'testcase/valid.json5'
    };
    var res = {
        set: sinon.spy(),
        send: sinon.spy()
    };
    server._debug.json(req, res, sinon.spy());

    var expect = null;
    try {
        expect = fs.readFileSync(path.join(__dirname, 'testcase/valid.json'), 'utf8');
    } catch(err) {}
    
    test.ok(res.send.calledWith(expect));
    test.end();
});

tape('json: invalid json5', function (test) {
    var req = {
        path: 'testcase/invalid.json5'
    };
    var res = {
        set: sinon.spy(),
        send: sinon.spy()
    };
    var next = sinon.spy();
    server._debug.json(req, res, next);
    test.ok(next.calledWith(sinon.match.instanceOf(Error)));
    test.end();
});

tape('start', function(test) {
    var callback = sinon.spy();
    server.start(callback);
    test.ok(callback.called);
    test.end();
});
