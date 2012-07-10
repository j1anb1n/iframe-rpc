var simpleXDM = function (config) {
    var util = simpleXDM._util;
    if (!config) {
        throw new Error('config is required');
    }
    var map = {};
    
    var handler = function (method) {
        
    };
    
    
    var transport = util.createTransport(config);
    
    transport.on('message', function () {
        
    });
    
    transport.send('');
    
    var rpc = new Rpc();
    
    handler = function (method) {
        var slice = Array.prototype.slice;
        return handler.exec(method).apply(handler, slice.call(arguments, 1));
    };

    if (config.method) {
        for (var method in config.method) {
            if (config.method.hasOwnProperty(method)) {
                var member = config.method[method];
                if (typeof member === "function") {
                    config.method[method] = {
                        method: member
                    };
                }
            }
        }
    }
    // create the stack
    var stack = util.createStack(config);
    stack.push(new simpleXDM.behavior.rpc(config));
    stack.push({
        callback: function (err) {
            if (config.onReady) {
                config.onReady(err);
            }
        }
    });
    stack = util.chainStack(stack);
    
    // get the iframe
    if (config.isHost) {
        var getIframe = simpleXDM.Fn.get(config.channel + '-get_iframe');
        if (getIframe) {
            handler.iframe = getIframe();
        }
    }
    handler.destroy = function(){
        stack.destroy();
    };
    handler.set = function (id, fn) {
        map[id] = fn;
    };
    
    
    
    
    stack.init();
    return handler;
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
