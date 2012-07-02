!function (simpleXDM) {
    simpleXDM.Rpc = function(config){
        var handler = function (method) {
            var slice = Array.prototype.slice;
            return handler.exec(method).apply(handler, slice.call(arguments, 1));
        };

        // expand shorthand notation
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
        var stack = chainStack(prepareTransportStack(config).concat([new easyXDM.stack.RpcBehavior(handler, config.method), {
            callback: function(success){
                if (config.onReady) {
                    config.onReady(success);
                }
            }
        }]));

        // set the origin 
        handler.origin = getLocation(config.remote);

        // get the main iframe
        if (config.isHost) {
            var getIframe = easyXDM.Fn.get(config.channel + '-get_iframe');
            if (getIframe) {
                handler.iframe = getIframe();
            }
        }
        /**
         * Initiates the destruction of the stack.
         */
        handler.destroy = function(){
            stack.destroy();
        };

        stack.init();
        return handler;
    };
} (simpleXDM);