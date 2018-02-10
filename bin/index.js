'use strict';

var net = require('net');
var util = require('util');

function createPromiseSocket() {
    var socket = new net.Socket();
    socket.connectp = util.promisify(socket.connect);
    return socket;
}
var StratumClient$1 = /** @class */ (function () {
    function StratumClient() {
        var _this = this;
        this.socket = createPromiseSocket();
        this.requestID = 0;
        this.methodListeners = {};
        this.nonIdListeners = {};
        this.socket.setEncoding("utf8");
        this.socket.on("data", function (data) {
            data.toString()
                .split("\n")
                .filter(function (s) { return s.length > 0; })
                .map(JSON.parse)
                .forEach(_this.onData.bind(_this));
        });
        this.socket.on("error", function (error) {
            if (_this.errorListener) {
                _this.errorListener(error);
            }
        });
        this.socket.on("close", function () {
            if (_this.closeListener) {
                _this.closeListener();
            }
        });
    }
    StratumClient.prototype.onData = function (json) {
        if (json.id !== null) {
            var listener = this.methodListeners[json.id];
            if (listener) {
                if (!json.result) {
                    return listener.reject(json.error);
                }
                listener.resolve(json);
            }
            return;
        }
        var listeners = this.nonIdListeners[json.method];
        if (listeners) {
            listeners.forEach(function (f) { return f(json); });
        }
    };
    StratumClient.prototype.onSocketClose = function (callback) {
        this.closeListener = callback;
    };
    StratumClient.prototype.onSocketError = function (callback) {
        this.errorListener = callback;
    };
    StratumClient.prototype.connect = function (port, host) {
        return this.socket.connectp(port, host);
    };
    StratumClient.prototype.write = function (method, params) {
        var _this = this;
        if (params === void 0) { params = []; }
        var id = this.requestID;
        var obj = { id: id, method: method, params: params };
        var data = JSON.stringify(obj) + "\n";
        this.socket.write(data);
        this.requestID++;
        // on("data") で結果が返ってくるまで resolve, reject を保持しておく
        return new Promise(function (resolve, reject) {
            _this.methodListeners[id] = { resolve: resolve, reject: reject };
        });
    };
    StratumClient.prototype.observe = function (method, callback, transform) {
        if (transform === void 0) { transform = function (x) { return x; }; }
        if (!this.nonIdListeners[method]) {
            this.nonIdListeners[method] = [callback];
        }
        else {
            this.nonIdListeners[method].push(callback);
        }
    };
    StratumClient.prototype.authorize = function (workerName, workerPassword) {
        if (workerPassword === void 0) { workerPassword = ""; }
        return this.write("mining.authorize", [workerName, workerPassword]);
    };
    StratumClient.prototype.subscribe = function () {
        return this.write("mining.subscribe");
    };
    StratumClient.prototype.submit = function (workerName, jobID, extraNonce2, nTime, nOnce) {
        return this.write("mining.submit", [workerName, jobID, extraNonce2, nTime, nOnce]);
    };
    StratumClient.prototype.getTransactions = function (jobID) {
        return this.write("mining.get_transactions", [jobID]);
    };
    StratumClient.prototype.onSetDifficulty = function (callback) {
        this.observe("mining.set_difficulty", callback);
    };
    StratumClient.prototype.onNotify = function (callback) {
        this.observe("mining.notify", function (result) {
            var _a = result.params, jobID = _a[0], prevhash = _a[1], coinb1 = _a[2], coinb2 = _a[3], merkleBranches = _a[4], version = _a[5], nBits = _a[6], nTime = _a[7], clean = _a[8];
            callback({
                jobID: jobID,
                prevhash: prevhash,
                coinb1: coinb1,
                coinb2: coinb2,
                merkleBranches: merkleBranches,
                version: version,
                nBits: nBits,
                nTime: nTime,
                clean: clean
            });
        });
    };
    return StratumClient;
}());

module.exports = StratumClient$1;
//# sourceMappingURL=index.js.map
