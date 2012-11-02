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
(function (util) {
    var AP = Array.prototype, OP = Object.prototype, FP = Function.prototype;
    
    var slice         = AP.slice,
        nativeForEach = AP.forEach;

    var each = function(obj, iterator, context) {
        if (!obj) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj) {
                    iterator.call(context, obj[i], i, obj);
                }
            }
        } else {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        }
    };
    
    util.lang = {
        isUndefined: function(obj) {
            return obj === void 0;
        },
        isArray: function (obj) {
            if (obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            } else {
                return false;
            }
        },
        isFunction: function (obj) {
            return typeof obj === 'function';
        },
        extend: function (obj, ext, overwrite) {
            for (var prop in ext) {
                if (prop in obj) {
                    var member = ext[prop];
                    if (typeof member === 'object') {
                        util.lang.extend(obj[prop], member, overwrite);
                    } else if (overwrite) {
                        obj[prop] = ext[prop];
                    }
                } else {
                    obj[prop] = ext[prop];
                }
            }
            return obj;
        },
        has: function (obj, key) {
            var t = typeof obj[key];
            return t == 'function' ||
            (!!(t == 'object' && obj[key])) ||
            t == 'unknown';
        },
        each: each,
        forEach: each
    };
})(RPC._util);
(function (util) {
    var reURI = /^((https?:)\/\/([^:\/\s]+)(:\d+)*)/; // returns groups for origin(1), protocol (2), domain (3) and port (4) ;
    util.url = {
        getPort: function (url) {
            
        },
        getMainDomain: function (url) {  // www.xxx.com => xxx.com
            var domain = util.url.getDomain(url);
            var re = /([^:\/\s\.]+)\.([^:\/\s\.]+)$/;
            if (domain && re.test(domain)) {
                return domain.match(re)[0];
            }
        },
        getDomain: function (url) {  // www.xxx.com
            var match = url.toLowerCase().match(reURI);
            if (match) {
                return match[3];
            }
        },
        resolve: function (url) {
            
        },
        getOrigin: function (url) { // http://www.xxx.com
            var match = url.toLowerCase().match(reURI);
            if (match) {
                return match[1];
            }
        },
        removeHash: function (url) {
            var indexOf = url.indexOf('#');
            return url.substr(0, indexOf);
        }
    };
})(RPC._util);
(function (util) {
    util.eventEmiter = function (that) {
        var callbacks = {};

        that.on = function (event, callback, scope) {
            callbacks[event] = callbacks[event] || [];
            callbacks[event].push({
                fn    : callback,
                scope : scope
            });
        };
        that.once = function (event, callback, scope) {
            callbacks[event] = callbacks[event] || [];
            callbacks[event].push({
                fn    : callback,
                scope : scope,
                type  : 1 // if (cb.type) { call_once }
            });
        };
        that.off = function (event, callback) {
            if (!callbacks) {
                callbacks[event] = []; //remove all events
            }
            
            var cbs = callbacks[event] = callbacks[event] || [], cb, temp = [];
            while(cbs.length) {
                 cb = cbs.shift();
                 if (cb.fn !== callback) {
                     temp.push(cb);
                 }
            }
            callbacks[event] = temp;
        };
        that.emit = function (event) {
            var cbs = callbacks[event] = callbacks[event] || [], cb, temp = [];
            var args = Array.prototype.slice.call(arguments, 1);
            while(cbs.length) {
                cb = cbs.shift();
                cb.fn.apply(cb.scope || this, [event].concat(args));
                if (!cb.type) {
                    temp.push(cb);
                }
            }
            callbacks[event] = temp;
        };
        that.addListener    = that.on;
        that.removeListener = that.off;
    };
}) (RPC._util);
(function (util) {
    util.JSON = {
        stringify : GJ.jsonEncode,
        parse     : GJ.jsonDecode
    };
}) (RPC._util);
(function (util) {
    var root = util.dom = {};
    var HAS_NAME_PROPERTY_BUG;
    // Event
    if (util.lang.has(window, 'addEventListener')) {
        root.on = function (target, type, listener) {
            target.addEventListener(type, listener, false);
        };
        root.off = function (target, type, listener) {
            target.removeEventListener(type, listener, false);
        };
    } else if (util.lang.has(window, 'attachEvent')) {
        root.on = function(target, type, listener){
            target.attachEvent("on" + type, listener);
        };
        root.off = function(target, type, listener){
            target.detachEvent("on" + type, listener);
        };
    } else {
        throw new Error("Browser not supported");
    }
    
    //isDomReady
    var domReadyQueue = [], readyState;
    var whenReady = function () {
        if (root.isReady) return;
        
        root.isReady = true;
        util.lang.each(domReadyQueue, function (fn) {
            setTimeout(fn, 0);
        });
        domReadyQueue = [];
    };
    root.isReady = false;
    root.ready = function (fn) {
        if (root.isReady) {
            setTimeout(fn, 0);
        } else {
            domReadyQueue.push(fn);
        }
    };
    
    if ("readyState" in document) {
        // If browser is WebKit-powered, check for both 'loaded' (legacy browsers) and
        // 'interactive' (HTML5 specs, recent WebKit builds) states.
        // https://bugs.webkit.org/show_bug.cgi?id=45119
        readyState = document.readyState;
        root.isReady = readyState == "complete" ||
                       (~ navigator.userAgent.indexOf('AppleWebKit/') &&
                       (readyState == "loaded" || readyState == "interactive"));
    } else {
        // If readyState is not supported in the browser, then in order to be able to fire whenReady functions apropriately
        // when added dynamically _after_ DOM load, we have to deduce wether the DOM is ready or not.
        // We only need a body to add elements to, so the existence of document.body is enough for us.
        root.isReady = !!document.body;
    }

    if (!root.isReady) {
        if (util.lang.has(window, "addEventListener")) {
            root.on(document, "DOMContentLoaded", whenReady);
        } else {
            root.on(document, "readystatechange", function(){
                if (document.readyState === "complete") {
                    whenReady();
                }
            });
            if (document.documentElement.doScroll && window === top) {
                var doScrollCheck = function(){
                    if (root.isReady) {
                        return;
                    }
                    // http://javascript.nwbox.com/IEContentLoaded/
                    try {
                        document.documentElement.doScroll("left");
                    } 
                    catch (e) {
                        setTimeout(doScrollCheck, 1);
                        return;
                    }
                    whenReady();
                };
                doScrollCheck();
            }
        }
        // A fallback to window.onload, that will always work
        root.on(window, "load", whenReady);
    }
    
    var createFrame = root.createFrame = function (config){
        if (typeof HAS_NAME_PROPERTY_BUG === 'undefined') {
            testForNamePropertyBug();
        }
        var iframe;
        var nameString = config.nameString || util.JSON.stringify({
            'RPC': {
                remote       : window.location.href,
                channel      : config.channel,
                protocol     : config.protocol,
                remoteDomain : document.domain,
                remoteOrigin : util.url.getOrigin(window.location.href),
                helper       : config.helper
            }
        });
        config.props = config.props || {};
        if (HAS_NAME_PROPERTY_BUG) {
            iframe = document.createElement("<iframe name='" + nameString + "'/>");
        } else {
            iframe = document.createElement("IFRAME");
            iframe.name = nameString;
        }
        if (typeof config.container == "string") {
            config.container = document.getElementById(config.container);
        }
        util.lang.extend(iframe.style, config.props.style, true);
        if (!config.container) {
            // This needs to be hidden like this, simply setting display:none and the like will cause failures in some browsers.
            util.lang.extend(iframe.style, {
                position: "absolute",
                top: "-2000px",
                // Avoid potential horizontal scrollbar
                left: "0px"
            }, true);
            config.container = document.body;
        }
        // HACK: IE cannot have the src attribute set when the frame is appended
        //       into the container, so we set it to "javascript:false" as a
        //       placeholder for now.  If we left the src undefined, it would
        //       instead default to "about:blank", which causes SSL mixed-content
        //       warnings in IE6 when on an SSL parent page.
        config.props.src = 'javascript:false';
        // transfer properties to the frame
        util.lang.extend(iframe, config.props, true);
        iframe.border = iframe.frameBorder = 0;
        iframe.allowTransparency = true;
        config.container.appendChild(iframe);
        // set the frame URL to the proper value (we previously set it to
        // "javascript:false" to work around the IE issue mentioned above)
        if (config.onLoad) {
            util.dom.on(iframe, "load", config.onLoad);
        }
        iframe.src = config.remote;
        return iframe;
    };


    // This tests for the bug in IE where setting the [name] property using javascript causes the value to be redirected into [submitName].
    function testForNamePropertyBug(){
        var form = document.body.appendChild(document.createElement("form")), input = form.appendChild(document.createElement("input"));
        input.name =  "TEST" + Math.random().toString(16).substring(2); // in order to avoid caching issues
        HAS_NAME_PROPERTY_BUG = input !== form.elements[input.name];
        document.body.removeChild(form);
    }

}) (RPC._util);
(function (util) {
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
    var window_name = {};
    try {
        window_name = util.windowName(window);
    } catch (ex) { }

    util.lang.extend(util.windowName, window_name, true);
    // check Access Control List
    util.checkACL = function(acl, domain){
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
        var stack = {
            incoming: function () { },
            outgoing: function (message) {
                stack.down.outgoing(message);
            },
            init: function () {
                stack.down.init();
            },
            ready: function () { },
            reset: function () { },
            destroy: function () {
                stack.down.destroy();
            }
        };
        for (var i = 0, len = stackElements.length; i < len; i++) {
            stackEl = stackElements[i];
            if (i !== 0) {
                stackEl.down = stackElements[i - 1];
            }
            if (i !== len - 1) {
                stackEl.up = stackElements[i + 1];
            } else {
                stackEl.up = stack;
                stack.down = stackEl;
            }
        }
        return stack;
    };
}) (RPC._util);
(function (Behavior, util) {
    Behavior.verify = function (config) {
        var pub, mySecret, theirSecret, verified = false;

        return (pub = {
            incoming: function(message){
                var indexOf = message.indexOf("_");
                if (indexOf === -1) {
                    if (message === mySecret) {
                        pub.up.ready();
                    } else if (!theirSecret) {
                        theirSecret = message;
                        if (config.isHost) {
                            startVerification();
                        }
                        pub.down.outgoing(message);
                    }
                } else {
                    if (message.substring(0, indexOf) === theirSecret) {
                        pub.up.incoming(message.substring(indexOf + 1));
                    }
                }
            },
            outgoing: function(message, fn){
                pub.down.outgoing(mySecret + "_" + message, fn);
            },
            init: function () {
                pub.down.init();
            },
            ready: function(success){
                mySecret = "";
                theirSecret = "";

                if (!config.isHost) {
                    startVerification();
                }
            },
            destroy: function () {
                mySecret = "";
                theirSecret = "";

                pub.down.destroy();
            }
        });

        function startVerification(){
            mySecret = Math.random().toString(16).substring(2);
            pub.down.outgoing(mySecret);
        }
    };
}) (RPC.behavior, RPC._util);
(function (Behavior) {
    Behavior.queue = function (config) {
        var pub, queue = [], incoming, waiting = true, maxLength = 1500;

        function dispatch(){
            if (waiting || queue.length === 0) {
                return;
            }
            waiting = true;
            var message = queue.shift();
            pub.down.outgoing(message.data, function(){
                if (message.callback) {
                    setTimeout(function(){
                        message.callback();
                    }, 0);
                }
                waiting = false;
                dispatch();
            });
        }
        return (pub = {
            incoming: function(message){
                var indexOf = message.indexOf("_"), seq = parseInt(message.substring(0, indexOf), 10);
                incoming += message.substring(indexOf + 1);
                if (seq === 0) {
                    message = incoming;
                    incoming = "";
                    pub.up.incoming(message);
                }
            },
            outgoing: function(message, fn){
                if (message.length > maxLength) {
                    var fragments = [], fragment;
                    // fragment into chunks
                    while (message.length !== 0) {
                        fragment = message.substring(0, maxLength);
                        message = message.substring(fragment.length);
                        fragments.push(fragment);
                    }
                    // enqueue the chunks
                    while ((fragment = fragments.shift())) {
                        queue.push({
                            data: fragments.length + "_" + fragment,
                            callback: fragments.length === 0 ? fn : null
                        });
                    }
                } else {
                    queue.push({
                        data: "0_" + message, // 0 means to this is the last fragment;
                        callback: fn
                    });
                }
                dispatch();
            },
            init: function(){
                pub.down.init();
            },
            ready: function(success){
                queue = [];
                waiting = false;
                incoming = "";

                dispatch();
                pub.up.ready();
            },
            destroy: function(){
                queue = [];
                waiting = true;
                incoming = "";
                pub.down.destroy();
            }
        });
    };
}) (RPC.behavior);
(function (Behavior) {
    Behavior.reliable = function(config){
        var pub, callback, idOut = 0, idIn = 0, currentMessage = "";

        return (pub = {
            incoming: function(message){
                var indexOf = message.indexOf("_"), ack = message.substring(0, indexOf).split(",");
                message = message.substring(indexOf + 1);

                if (ack[0] == idOut) {
                    currentMessage = "";
                    if (callback) {
                        var temp = callback;
                        callback = null;
                        temp(true);
                    }
                }
                if (message.length > 0) {
                    pub.down.outgoing(ack[1] + "," + idOut + "_" + currentMessage);
                    if (idIn != ack[1]) {
                        idIn = ack[1];
                        pub.up.incoming(message);
                    }
                }
            },
            outgoing: function(message, cb){
                currentMessage = message;
                callback = cb;
                pub.down.outgoing(idIn + "," + (++idOut) + "_" + message);
            },
            init: function () {
                pub.down.init();
            },
            ready: function () {
                idOut = 0;
                idIn = 0;
                currentMessage = "";
                callback = null;
                pub.up.ready();
            },
            destroy: function () {
                idOut = 0;
                idIn = 0;
                currentMessage = "";
                callback = null;
                
                pub.down.destroy();
            }
        });
    };
}) (RPC.behavior);
(function (Behavior, util) {
    Behavior.buffer = function (config) {
        var messageBuffer = [];

        var pub = {
            incoming: function (message) {
                pub.up.incoming(message);
            },
            outgoing: function (message) {
                messageBuffer.push(message);
            },
            init: function () {
                pub.down.init();
            },
            ready: function () {
                // remove frome stack
                pub.incoming = pub.up.incoming;
                pub.outgoing = pub.down.outgoing;

                util.lang.each(messageBuffer, function (message) {
                    pub.outgoing(message);
                });

                pub.up.ready();
            },
            destroy: function () {
                messageBuffer = [];
                pub.down.destroy();
            }
        };
        return pub;
    };
}) (RPC.behavior, RPC._util);
(function (Behavior, util) {
    Behavior.hash = function (config) {
        var pub, hashWriter, hashReader, baseUrl, lastMsg, timer;
        var isReady = false;
        return (pub = {
            incoming: function (message, remote) {
                if (message === 'ready') {
                    pub.ready(remote);
                } else {
                    pub.up.incoming(message);
                }
            },
            outgoing: function (message) {
                var url = baseUrl + "#_" + message;
                hashWriter.contentWindow.location = url;
            },
            init: function () {
                if (config.isHost) {
                    window.RPC_Fn.set(config.channel+"helper_ready", function (win, remote) {
                        if (util.checkACL(config.acl, remote)) {
                            hashReader = win;
                            hashWriter = config.iframe;
                            baseUrl    = remote;
                            startPolling();
                            util.dom.on(win, 'unload', function () {
                                stopPolling();
                            });
                        }
                    });
                } else {
                    hashWriter = util.dom.createFrame({
                        nameString : config.channel+"helper_ready"+" "+window.location.href,
                        remote     : config.helper,
                        onLoad     : function () {
                            baseUrl = config.helper;
                            pub.outgoing('ready');
                        }
                    });
                    hashReader = window;
                    startPolling();
                }
            },
            ready: function () {
                if (config.isHost) {
                    pub.outgoing('ready');
                }
                pub.up.ready();
            },
            destroy: function () {
                if (hashWriter && hashWriter.parentNode && hashWriter.parentNode.removeChild) {
                    hashWriter.parentNode.removeChild(hashWriter);
                }
            }
        });

        function polling() {
            if (!hashReader) { return; }

            var href    = hashReader.location.href,
                hash    = "", 
                indexOf = href.indexOf("#");

            if (indexOf != -1) {
                hash = href.substring(indexOf);
            }
            if (hash && hash !== lastMsg) {
                lastMsg = hash;
                var message = lastMsg.substring(lastMsg.indexOf("_") + 1);
                pub.incoming(message);
            }
        }
        function startPolling () {
            timer = setInterval(polling, config.interval);
        }
        function stopPolling () {
            clearInterval(timer);
        }
    };
}) (RPC.behavior, RPC._util);
(function (Behavior, util) {
    Behavior.postMessage = function (config) {
        var targetOrigin = config.remoteOrigin,
            postFnHost   = { postMessage: function () {} };

        util.dom.on(window, 'message', function (event) {
            if (event.data.indexOf(config.channel) === 0) {  // {{ config.channel }}_{{ message }}
                var origin = util.url.getDomain(getOrigin(event));
                var message = event.data.substr(config.channel.length+1);

                if (util.checkACL(config.acl, origin)) {
                    if (message === 'ready') {
                        targetOrigin = getOrigin(event); // set up new target
                        if (config.isHost) {
                            pub.outgoing('ready');
                        }

                        pub.up.ready();
                    } else {
                        pub.incoming(message);
                    }
                } else {
                    throw new Error(origin + ' is not in Access Control List!');
                }
            }
        });

        var pub = {
            incoming: function (message) {
                pub.up.incoming(message);
            },
            outgoing: function (message) {
                postFnHost.postMessage(config.channel + "_" + message, targetOrigin);
            },
            init: function () {
                if (config.isHost) {
                    var i = config.iframe;
                    postFnHost = ("postMessage" in i.contentWindow) ? i.contentWindow : i.contentWindow.document;
                } else {
                    postFnHost = ("postMessage" in window.parent) ? window.parent : window.parent.document;
                    util.dom.ready(function () {
                        pub.outgoing('ready');
                    });
                }
            },
            ready: function () {
                pub.up.ready();
            },
            reset: function () {

            },
            destroy: function () {
                config.iframe.parentNode.removeChild(config.iframe);
            }
        };
        return pub;
    };

    function getOrigin(event){
        if (event.origin) {
            // This is the HTML5 property
            return util.url.getOrigin(event.origin);
        }
        if (event.uri) {
            // From earlier implementations 
            return util.url.getOrigin(event.uri);
        }
        if (event.domain) {
            // This is the last option and will fail if the 
            // origin is not using the same schema as we are
            return location.protocol + "//" + event.domain;
        }
        throw "Unable to retrieve the origin of the event";
    }
}) (RPC.behavior, RPC._util);
(function (Behavior, util) {
    Behavior.sameorigin = function (config) {
        var pub, remote;
        if (config.isHost) {
            remote = {
                outgoing: function (message) {
                    pub.incoming(message);
                }
            };
            pub = {
                incoming: function (message) {
                    if (message === 'ready') {
                        pub.ready();
                    } else {
                        pub.up.incoming(message);
                    }
                },
                outgoing: function (message) {
                    setTimeout(function () {
                        remote.incoming(message);
                    }, 0);
                },
                init: function () {
                },
                ready: function () {
                    pub.up.ready();
                    pub.outgoing('ready');
                },
                reset: function () {
                },
                destroy: function () {
                    config.iframe.parentNode.removeChild(config.iframe);
                }
            };

            window.RPC_Fn.set(config.channel+"get_remote", function () {
                return remote;
            });
        } else {
            remote = window.parent.RPC_Fn.get(config.channel+"get_remote")();
            remote.incoming = function (message) {
                pub.incoming(message);
            };
            pub = {
                incoming: function (message) {
                    if (message === 'ready') {
                        pub.ready();
                    } else {
                        pub.up.incoming(message);
                    }
                },
                outgoing: function (message) {
                    setTimeout(function () {
                        remote.outgoing(message);
                    }, 0);
                },
                init: function () {
                    pub.outgoing('ready');
                },
                ready: function () {
                    pub.up.ready();
                },
                reset: function () {

                },
                destroy: function () {

                }
            };
        }
        return pub;
    };
}) (RPC.behavior, RPC._util);
(function (RPC, util) {
    RPC.Transport = function (config) {
        var me = this, stack = [];
        util.eventEmiter(this);

        var query = {}, transport;
        
        if (!config.props) {
            config.props = {};
        }

        if (config.isHost) {
            if (typeof config.isSameOrigin === 'undefined') {
                config.isSameOrigin = util.url.getMainDomain(window.location.href) === util.url.getMainDomain(config.remote);
            }
            config.remoteOrigin = util.url.getOrigin(config.remote) || util.url.getOrigin(window.location.href);
            if (config.isSameOrigin) {
                config.protocol = "0";
            } else if (window.postMessage || document.postMessage) {
                /*
                 * This is supported in IE8+, Firefox 3+, Opera 9+, Chrome 2+ and Safari 4+
                 */
                config.protocol = "1";
            } else {
                /*
                 * This is supported in all browsers where [window].location is writable for all
                 * The resize event will be used if resize is supported and the iframe is not put
                 * into a container, else polling will be used.
                 */
                config.protocol = "2";
            }
        } else {
            query = util.windowName.get('RPC');
            if (!query) {
                throw new Error('arguments missing');
            }
            config.channel  = query.channel;
            config.protocol = query.protocol;
            config.remote   = query.remote;
            config.helper   = query.helper;
            config.remoteOrigin = query.remoteOrigin;
            if (query.remoteDomain === document.domain) {
                config.isSameOrigin = true;
            } else {
                config.isSameOrigin = false;
            }
        }
        if (!util.checkACL(config.acl, util.url.getDomain(config.remote))) {
            throw new Error("Access denied for " + config.remote);
        }
        switch (config.protocol) {
            case "0":
                stack = [new RPC.behavior.sameorigin(config)];
                break;
            case "1":
                stack = [new RPC.behavior.postMessage(config)];
                break;
            case "2":
                util.lang.extend(config, {
                    interval: 20
                });
                stack = [new RPC.behavior.hash(config),
                         new RPC.behavior.reliable(config),
                         new RPC.behavior.queue(config),
                         new RPC.behavior.verify(config)];
                break;

        }
        stack.push(new RPC.behavior.buffer(config));
        stack = util.chainStack(stack);

        this.send = function (message) {
            stack.outgoing(message);
        };

        this.init = function () {
            if (config.isHost) {
                config.iframe = util.dom.createFrame(config);
            }
            stack.init();
            stack.incoming = function (message) {
                me.emit('message', message);
            };
            stack.ready = function () {
                me.emit('ready');
            };
        };
        this.destroy = function () {
            stack.destroy();
        };
    };
}) (RPC, RPC._util);