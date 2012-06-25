!function (Behavior) {
    Behavior.verify = function (config) {
        if (undef(config.initiate)) {
            throw new Error("settings.initiate is not set");
        }
        var pub, mySecret, theirSecret, verified = false;

        function startVerification(){
            mySecret = Math.random().toString(16).substring(2);
            pub.down.outgoing(mySecret);
        }

        return (pub = {
            reset: function () {
                mySecret = "";
                theirSecret = "";

                var queue = new easyXDM.stack.QueueBehavior({
                    remove: true
                });
                pub.up.reset();
                queue.up = pub.up;
                pub.up.down = queue;
                pub.up = queue;
                queue.down = pub;
                if (config.initiate) {
                    startVerification();
                }
            },
            incoming: function(message, origin){
                var indexOf = message.indexOf("_");
                if (indexOf === -1) {
                    if (message === mySecret) {
                        pub.up.callback(true);
                    }
                    else if (!theirSecret) {
                        theirSecret = message;
                        if (!config.initiate) {
                            startVerification();
                        }
                        pub.down.outgoing(message);
                    }
                }
                else {
                    if (message.substring(0, indexOf) === theirSecret) {
                        pub.up.incoming(message.substring(indexOf + 1), origin);
                    }
                }
            },
            outgoing: function(message, origin, fn){
                pub.down.outgoing(mySecret + "_" + message, origin, fn);
            },
            callback: function(success){
                if (config.initiate) {
                    startVerification();
                }
            }
        });
    };
}(simpleXDM.behavior);