var expect = require('expect.js');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var path = require('path');
var server = proxyquire('../server.js', {
    config: {
        webapps: __dirname
    }
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

    it('compile', function(done) {
        var vmPath = path.join(__dirname, 'testcase/index.vm');
        var contentPath = path.join(__dirname, 'testcase/index_expect.html');
        var content = server._debug.getFileContent(contentPath);
        server._debug.compile(vmPath, function(err, ret) {
            expect(ret).to.be(content);
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

    var testRepaceSSI = function(vm, options, expectedPath) {
        var vmPath = path.resolve(__dirname, vm);
        var vmFile = new File({
            path: vmPath,
            contents: new Buffer(server._debug.getFileContent(vmPath))
        });
        var ret = server._debug.replaceSSI(vmFile, options.reg, options.maxDepth);
        var expected = server._debug.getFileContent(expectedPath);
        expect(ret).to.be(expected);
    }
    
    it('replaceSSI: #parse maxDepth = 10', function() {
        var options = {
            maxDepth: 10,
            reg: server._debug.replaceSSI.reg.macroParse
        };
        var expectedPath = path.resolve(__dirname, 'testcase/list_expect.html');
        testRepaceSSI('testcase/list.vm', options, expectedPath);
    });

    it('replaceSSI: #parse maxDepth = 1', function() {
        var options = {
            maxDepth: 1,
            reg: server._debug.replaceSSI.reg.macroParse
        };
        var expectedPath = path.resolve(__dirname, 'testcase/list_expect2.html');
        testRepaceSSI('testcase/list.vm', options, expectedPath);
    });

    it('replaceSSI: #include', function() {
        var options = {
            maxDepth: 10,
            reg: server._debug.replaceSSI.reg.macroInclude
        };
        var expectedPath = path.resolve(__dirname, 'testcase/detail_expect.html');
        testRepaceSSI('testcase/detail.vm', options, expectedPath);
    });

    it('replaceSSI: ssi include', function() {
        var options = {
            maxDepth: 10,
            reg: server._debug.replaceSSI.reg.ssiInclude
        };
        var expectedPath = path.resolve(__dirname, 'testcase/result_expect.html');
        testRepaceSSI('testcase/result.vm', options, expectedPath);
    });

});