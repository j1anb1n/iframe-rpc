var simpleXDM = function (config) {
    var util = simpleXDM._util;
    var emptyFn = function () {};
    config = config || {};

    var callbacks = {};
    var methods = {};
    var ms = config.method = config.method || {};

    for (var m in ms) { 
        if (ms.hasOwnProperty(m)) {
            if (typeof ms[m] === 'function') {
                methods[m] = {
                    scope: {}
                    ,fn: ms[m]
                };
            } else {
                methods[m] = {
                    scope: ms[m].scope
                    ,fn: ms[m].fn
                };
            }
        }
    }

    var transport = util.createTransport(config);
    transport.sendJSON = function (message) {
        this.send(util.JSON.stringify(message));
    };

    var Fn = function (method) {
        var results = util.rpc.stringify.apply({}, arguments);
        var message = results[0];
        callbacks[message.id] = results[1];
        transport.sendJSON(message);
    };

    Fn.set = function(id, method) {
        if (typeof method === 'function') {
            methods[id] = {
                scope: {}
                ,fn: method
            };
        } else {
            methods[id] = {
                scope: method.scope
                ,fn: method.fn
            };
        }
    };
    Fn.destroy = function(){
        transport.destroy();
    };

    transport.on('message', function (message) {
        if (message.method) { // exec method
            execMethod(message.method, message.id, methods[message.method], message.params);
        } else { // exec callback
            var callback = callbacks[message.id];
            if (message.error) {
                if (callback.error) {
                    callback.error(message.error);
                }
            } else if (callback.success) {
                callback.success(message.result);
            }
            delete callbacks[message.id];
        }
    });

    function execMethod(method, id, func, params) {
        if (!func) {
            if (id) {
                transport.sendJSON({
                    id: id
                    ,error: {
                        code: -32601,
                        message: "Procedure not found."
                    }
                });
            }
            return;
        }

        var success, error;
        if (id) {
            success = function(result){
                success = emptyFn;
                transport.sendJSON({
                    id: id,
                    result: result
                });
            };
            error = function(message, data){
                error = emptyFn;
                var msg = {
                    id: id,
                    error: {
                        code: -32099,
                        message: message
                    }
                };
                if (data) {
                    msg.error.data = data;
                }
                transport.sendJSON(msg);
            };
        } else {
            success = error = emptyFn;
        }
        // Call local method
        if (!util.lang.isArray(params)) {
            params = [params];
        }
        try {
            var result = func.fn.apply(func.scope, params.concat([success, error]));
            if (!util.lang.isUndefined(result)) {
                success(result);
            }
        } 
        catch (ex1) {
            error(ex1.message);
        }
    }
    
    // get the iframe
    if (config.isHost) {
        var getIframe = simpleXDM.Fn.get(config.channel + '-get_iframe');
        if (getIframe) {
            Fn.iframe = getIframe();
        }
    }

    // init the transport
    transport.init();
    return Fn;
};

simpleXDM._util = {};

simpleXDM.transport = {};

simpleXDM.behavior = {};

!function (simpleXDM) {
    var map = {};
    simpleXDM.Fn = {
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
}(simpleXDM);