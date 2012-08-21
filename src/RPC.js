var RPC = function (config) {
    var me = this;
    var util = RPC._util;
    var emptyFn = function () {};
    config = config || {};
    config.isHost = config.remote ? true : false;

    var callbacks = {};
    var methods = config.method = config.method || {};
    var transport = util.createTransport(config);
    var messageID = 0;
    transport.sendJSON = function (message) {
        this.send(util.JSON.stringify(message)); // this === transport
    };
    transport.on('ready', function () {
        if (util.lang.isFunction(config.onReady)) {
            config.onReady.call(me);
        }
    });
    var Fn = function (method, params, onSuccess, onError) {
        var message = {
            jsonrpc: "2.0"
            ,method: method
            ,params: params
        };

        if (util.lang.isFunction(params)) {
            onError = onSuccess;
            onSuccess = params;
        }

        if (util.lang.isFunction(onSuccess) || util.lang.isFunction(onError)) {
            message.id = messageID;
            callbacks[messageID] = {
                success: onSuccess || function () {}
                ,error: onError || function () {}
            }
        }

        messageID++;
        setTimeout(function () {
            transport.sendJSON(message);
        }, 0);
    }

    Fn.set = function(id, method) {
        methods[id] = method;
    };
    Fn.destroy = function(){
        messageID = 0;
        methods = {};
        callbacks = {};
        transport.destroy();
    };

    transport.on('message', function (e, message) {
        message = util.JSON.parse(message);

        if (message.method) { // exec method
            execMethod(message);
        } else if (message.id) { // exec callback
            var callback = callbacks[message.id];
            console.log('call callback', message, callback);
            if (callback) {
                if (message.result) {
                    callback.success(message.result);
                } else {
                    callback.error(message.error);
                }
            }
        }
    });

    function execMethod(message) {
        var response = {
            success: function (data) {
                if (message.id) {
                    transport.sendJSON({
                        id: message.id
                        ,result: data
                    });
                }
                return;
            }
            ,error: function (errorMsg, data, code) {
                if (message.id) {
                    var msg = {
                        id: message.id
                        ,code: code || -32099
                        ,message: errorMsg
                    }
                    if (data) {
                        msg.data = data;
                    }
                    transport.sendJSON(msg);
                }
                return;
            }
        }
        var fn = methods[message.method];
        if (!util.lang.isFunction(fn)) {
            return response.error("Procedure not found.", null, -32601);
        } else {
            try {
                var result = fn.apply({}, message.params);
                if (result) {
                    response.success(result);
                }
            } catch (ex) {
                response.error(ex.message, ex.data);
            }
        }
    }

    // init the transport
    transport.init();
    return Fn;
};
RPC._util = {};

RPC.transport = {};

RPC.behavior = {};

+function (RPC) {
    var map = {};
    RPC.Fn = {
        get: function (id, del) {
            var fn = map[id];
            if (del) {
                delete map[id];
            }
            return fn;
        }
        ,set: function (id, fn) {
            map[id] = fn;
        }
    };
    if (module) {
        module.exports = RPC;
    }
}(RPC);