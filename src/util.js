!function (util) {
    // Window.name
    util.windowName = function (win) {
        if (win.name === "") {
            win.name = "{}";
        }

        return {
            set: function (key, value) {
                var obj;
                obj = util.JSON.parse(win.name);
                obj[key] = value;
                win.name = util.JSON.stringify(obj);
            },
            get: function (key) {
                return util.JSON.parse(win.name)[key];
            },
            remove: function (key) {
                var obj;
                obj = util.JSON.parse(win.name);
                var ret = obj[key];
                delete obj[key];
                win.name = util.JSON.stringify(obj);
                return ret;
            },
            clear: function () {
                var ret = win.name;
                win.name = "{}";
                return ret;
            },
            toString: function () {
                return win.name;
            },
            toJSON: function () {
                return win.name;
            }
        };
    };
    var window_name = util.windowName(window);
    util.lang.extend(util.windowName, window_name, true);
    // check Access Control List
    util.checkAcl = function(acl, domain){
        if (!acl || !acl.length) return true; //'none' to accept 'all'
        // normalize into an array
        if (typeof acl == "string") {
            acl = [acl];
        }
        var re, i = acl.length;
        while (i--) {
            re = acl[i];
            re = new RegExp(re.substr(0, 1) == "^" ? re : ("^" + re.replace(/(\*)/g, ".$1").replace(/\?/g, ".") + "$"));
            if (re.test(domain)) {
                return true;
            }
        }
        return false;
    };
    
    util.chainStack = function (stackElements){
        var stackEl, defaults = {
            reset: function(config){
                this.up.reset(config);
            },
            incoming: function(message, origin){
                this.up.incoming(message, origin);
            },
            outgoing: function(message, recipient){
                this.down.outgoing(message, recipient);
            },
            callback: function(success){
                this.up.callback(success);
            },
            init: function(){
                this.down.init();
            },
            destroy: function(){
                this.down.destroy();
            }
        };
        for (var i = 0, len = stackElements.length; i < len; i++) {
            stackEl = stackElements[i];
            util.lang.extend(stackEl, defaults);
            if (i !== 0) {
                stackEl.down = stackElements[i - 1];
            }
            if (i !== len - 1) {
                stackEl.up = stackElements[i + 1];
            }
        }
        return stackEl;
    };
    
    util.createTransport = function(config){
        var query = util.windowName.get('simpleXDM'), protocol = config.protocol, stack;
        var isHost = config.isHost = config.isHost || util.lang.isUndefined(query && query.protocol);
        
        if (!isHost) {
            config.remote = query.remote;
            config.channel = query.channel;
            protocol = query.protocol;
            if (query.remoteDomain === document.domain) {
                config.isSameOrigin = true;
            } else {
                config.isSameOrigin = false;
            }
        }
        if (config.acl && !util.checkAcl(config.acl, util.path.getDomain(config.remote))) {
            throw new Error("Access denied for " + config.remote);
        }
        
        if (!config.props) {
            config.props = {};
        }
        if (isHost) {
            // config.channel = config.channel || "default" + channelId++;
            // config.secret = Math.random().toString(16).substring(2);

            if (util.lang.has(window, "postMessage") || util.lang.has(document, "postMessage")) {
                /*
                 * This is supported in IE8+, Firefox 3+, Opera 9+, Chrome 2+ and Safari 4+
                 */
                protocol = "1";
            }
            else {
                /*
                 * This is supported in all browsers where [window].location is writable for all
                 * The resize event will be used if resize is supported and the iframe is not put
                 * into a container, else polling will be used.
                 */
                protocol = "0";
            }
        }
        config.protocol = protocol; // for conditional branching
        switch (protocol) {
            case "0":
                util.lang.extend(config, {
                    interval: 100
                    ,delay: 2000
                });
                stack = [
                    new simpleXDM.transport.hashTransport(config)
                    ,new simpleXDM.behavior.reliable(config)
                    ,new simpleXDM.behavior.queue(config)
                    ,new simpleXDM.behavior.verify(config)
                ];
                break;
            case "1":
                stack = [new simpleXDM.transport.postMessageTransport(config)];
                break;
        }
        stack.push(new simpleXDM.behavior.buffer(config));
        var pub = {
            incoming: function (message) {
                console.log('incoming', message);
            }
            ,init: function () {
                console.log('init');
                this.down.init();
            }
            ,callback: function () {
                console.log('inited');
            }
            ,reset: function () {
                console.log('reset');
            }
        };
        stack.push(pub);
        stack = util.chainStack(stack);

        return {
            send: pub.outgoing
            ,init: pub.init
        };
    };
    util.rpc = {
        stringify: (function (){
            var callbackCounter = 0;
            return function (method) {
                var slice = Array.prototype.slice;
                var l = arguments.length, callback, message = {
                    jsonrpc: "2.0"
                    ,method: method
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
                    } else {
                        // single callback, success
                        callback = {
                            success: arguments[l - 1]
                        };
                        message.params = slice.call(arguments, 0, l - 1);
                    }
                    message.id = ++callbackCounter;
                } else {
                    // no callbacks, a notification
                    message.params = slice.call(arguments, 0);
                }
                return [message, callback];
            };
        })()
    };
}(simpleXDM._util);