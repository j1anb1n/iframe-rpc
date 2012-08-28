+function (Behavior) {
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
            }
            ,outgoing: function(message, fn){
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
            }
            
            ,init: function(){
                pub.down.init();
            }
            ,ready: function(success){
                queue = [];
                waiting = false;
                incoming = "";

                dispatch();
                pub.up.ready();
            }
            ,destroy: function(){
                queue = [];
                waiting = true;
                incoming = "";
                pub.down.destroy();
            }
        });
    };
} (RPC.behavior);