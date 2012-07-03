!function (Behavior) {
    Behavior.queue = function (config) {
        var pub, queue = [], waiting = true, incoming = "", destroying, maxLength = 0, lazy = false, doFragment = false;

        function dispatch(){
            if (config.remove && queue.length === 0) {
                removeFromStack(pub);
                return;
            }
            if (waiting || queue.length === 0 || destroying) {
                return;
            }
            waiting = true;
            var message = queue.shift();
            pub.down.outgoing(message.data, message.origin, function(success){
                if (message.callback) {
                    setTimeout(function(){
                        message.callback(success);
                    }, 0);
                }
                waiting = false;
                dispatch();
            });
        }
        return (pub = {
            init: function(){
                if (undef(config)) {
                    config = {};
                }
                if (config.maxLength) {
                    maxLength = config.maxLength;
                    doFragment = true;
                }
                if (config.lazy) {
                    lazy = true;
                }
                else {
                    pub.down.init();
                }
            },
            callback: function(success){
                waiting = false;
                var up = pub.up; // in case dispatch calls removeFromStack
                dispatch();
                up.callback(success);
            },
            reset: function (config) {
                waiting = false;
                var up = pub.up; // in case dispatch calls removeFromStack
                dispatch();
                up.reset(config);
            },
            incoming: function(message, origin){
                if (doFragment) {
                    var indexOf = message.indexOf("_"), seq = parseInt(message.substring(0, indexOf), 10);
                    incoming += message.substring(indexOf + 1);
                    if (seq === 0) {
                        if (config.encode) {
                            incoming = decodeURIComponent(incoming);
                        }
                        message = incoming;
                        incoming = "";
                        pub.up.incoming(message, origin);
                    }
                }
                else {
                    pub.up.incoming(message, origin);
                }
            },
            outgoing: function(message, origin, fn){
                if (config.encode) {
                    message = encodeURIComponent(message);
                }
                var fragments = [], fragment;
                if (doFragment) {
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
                            origin: origin,
                            callback: fragments.length === 0 ? fn : null
                        });
                    }
                }
                else {
                    queue.push({
                        data: message,
                        origin: origin,
                        callback: fn
                    });
                }
                if (lazy) {
                    pub.down.init();
                }
                else {
                    dispatch();
                }
            },
            destroy: function(){
                destroying = true;
                pub.down.destroy();
            }
        });
    };
}(simpleXDM.behavior);