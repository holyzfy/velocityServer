var tape = require('tape');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var server = proxyquire('../server.js', {
    config: {
        webapps: ''
    }
});

tape('start', function(test) {
    var callback = sinon.stub();
    server.start(callback);
    test.ok(callback.calledWith(sinon.match.instanceOf(Error)));
    test.end();
});
