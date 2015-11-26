var expect = require('expect.js');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var server = proxyquire('../server.js', {
    config: {
        webapps: ''
    }
});

describe(__filename, function() {
    it('start', function() {
        var callback = sinon.stub();
        server.start(callback);
        expect(callback.calledWith(sinon.match.instanceOf(Error))).to.be(true)
    });
})