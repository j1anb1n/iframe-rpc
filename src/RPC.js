var channelCounter = 0;
var RPC = function (config) {
    var me = this;
    var util = RPC._util;
    var emptyFn = function () {};
    config = config || {};
    config.isHost = config.remote ? true : false;
    config.channel = 'RPC_CHANNEL_' + (channelCounter++);

    var callbacks = {};
    var methods = config.method = config.method || {};
    var messageID = 1;

    var transport = new RPC.Transport(config);

    transport.on('ready', function () {
        if (util.lang.isFunction(config.onReady)) {
            config.onReady.call(me);
        }
    });

    transport.on('message', function (e, message) {
        try {
            message = util.JSON.parse(message);
        } catch (ex) {
            me.send({"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error."}, "id": null});
            return;
        }
        if (message.method) { // exec method
            execMethod(message);
        } else if (message.id) { // exec callback
            var callback = callbacks[message.id];
            if (callback) {
                if (message.result) {
                    callback.success(message.result);
                } else {
                    callback.error(message.error);
                }
            }
        }
    });

    this.send = function (message) {
        transport.send(util.JSON.stringify(message));
    };

    var Fn = function (method, params, onSuccess, onError) {
        var message = {
            jsonrpc : "2.0",
            method  : method,
            params  : params
        };

        if (util.lang.isFunction(params)) {
            onError = onSuccess;
            onSuccess = params;
        }

        if (util.lang.isFunction(onSuccess) || util.lang.isFunction(onError)) {
            message.id = messageID;
            callbacks[messageID] = {
                success : onSuccess || function () {},
                error   : onError || function () {}
            };
        }

        messageID++;
        setTimeout(function () {
            me.send(message);
        }, 0);
    };

    Fn.set = function(id, method) {
        methods[id] = method;
    };
    Fn.destroy = function(){
        messageID = 0;
        methods = {};
        callbacks = {};
        transport.destroy();
    };

    function execMethod(message) {
        var response = {
            success: function (data) {
                if (message.id) {
                    me.send({
                        id     : message.id,
                        result : data
                    });
                }
                return;
            },
            error: function (errorMsg, data, code) {
                if (message.id) {
                    var msg = {
                        id    : message.id,
                        error : {
                            code    : code || -32099,
                            message : errorMsg
                        }
                    };
                    if (data) {
                        msg.data = data;
                    }
                    me.send(msg);
                }
                return;
            }
        };
        var fn = methods[message.method];
        if (!util.lang.isFunction(fn)) {
            return response.error("Procedure not found.", null, -32601);
        } else {
            var result;
            try {
                if (!util.lang.isArray(message.params)) {
                    message.params = [message.params];
                }
                result = fn.apply({}, message.params);
            } catch (ex) {
                response.error(ex.message, ex.data);
            }
            if (result) {
                response.success(result);
            }
        }
    }
    // init the transport
    transport.init();
    Fn.iframe = config.iframe;
    return Fn;
};
RPC._util = {};

RPC.behavior = {};

(function () {
    var callbacks = {};
    if (window.RPC_Fn) { return; }
    window.RPC_Fn = {
        set    : function (key, fn) {
            callbacks[key] = fn;
        },
        get    : function (key) {
            return callbacks[key];
        },
        remove : function (key) {
            delete callbacks[key];
        }
    };
})();

if (module) {
    module.exports = RPC;
}