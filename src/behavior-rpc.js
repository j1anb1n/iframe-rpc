!function (Behavior) {
    Behavior.rpc = function(proxy, config){
        var pub;
        var _callbackCounter = 0, _callbacks = {};
        var slice = Array.prototype.slice;
        var methods = {};

        /**
         * Serializes and sends the message
         * @private
         * @param {Object} data The JSON-RPC message to be sent. The jsonrpc property will be added.
         */
        function _send(data){
            data.jsonrpc = "2.0";
            pub.down.outgoing(serializer.stringify(data));
        }

        /**
         * Creates a method that implements the given definition
         * @private
         * @param {Object} The method configuration
         * @param {String} method The name of the method
         * @return {Function} A stub capable of proxying the requested method call
         */
        function _createMethod(method){
            return function(){
                var l = arguments.length, callback, message = {
                    method: method
                };

                if (l > 0 && typeof arguments[l - 1] === "function") {
                    //with callback, procedure
                    if (l > 1 && typeof arguments[l - 2] === "function") {
                        // two callbacks, success and error
                        callback = {
                            success: arguments[l - 2],
                            error: arguments[l - 1]
                        };
                        message.params = slice.call(arguments, 0, l - 2);
                    }
                    else {
                        // single callback, success
                        callback = {
                            success: arguments[l - 1]
                        };
                        message.params = slice.call(arguments, 0, l - 1);
                    }
                    _callbacks["" + (++_callbackCounter)] = callback;
                    message.id = _callbackCounter;
                }
                else {
                    // no callbacks, a notification
                    message.params = slice.call(arguments, 0);
                }
                // Send the method request
                _send(message);
            };
        }

        /**
         * Executes the exposed method
         * @private
         * @param {String} method The name of the method
         * @param {Number} id The callback id to use
         * @param {Function} method The exposed implementation
         * @param {Array} params The parameters supplied by the remote end
         */
        function _executeMethod(method, id, fn, params){
            if (!fn) {
                if (id) {
                    _send({
                        id: id,
                        error: {
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
                    _send({
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
                    _send(msg);
                };
            }
            else {
                success = error = emptyFn;
            }
            // Call local method
            if (!isArray(params)) {
                params = [params];
            }
            try {
                var result = fn.method.apply(fn.scope, params.concat([success, error]));
                if (!undef(result)) {
                    success(result);
                }
            } 
            catch (ex1) {
                error(ex1.message);
            }
        }

        return (pub = {
            incoming: function(message, origin){
                var data = serializer.parse(message);
                if (data.method) {
                    // A method call from the remote end
                    if (config.handle) {
                        config.handle(data, _send);
                    }
                    else {
                        _executeMethod(data.method, data.id, config[data.method], data.params);
                    }
                }
                else {
                    // A method response from the other end
                    var callback = _callbacks[data.id];
                    if (data.error) {
                        if (callback.error) {
                            callback.error(data.error);
                        }
                    }
                    else if (callback.success) {
                        callback.success(data.result);
                    }
                    delete _callbacks[data.id];
                }
            },
            init: function(){
                proxy.exec = function (method) {
                    if (methods[method]) {
                        return methods[method];
                    }
                    methods[method] = _createMethod(method);
                    return methods[method];
                };
                pub.down.init();
            },
            reset: function () {

                methods = {};
            },
            destroy: function(){
                pub.down.destroy();
            }
        });
    };
} (simpleXDM.behavior);