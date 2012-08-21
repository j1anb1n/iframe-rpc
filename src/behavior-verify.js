+function (Behavior, util) {
    Behavior.verify = function (config) {
        var pub, mySecret, theirSecret, verified = false;

        function startVerification(){
            mySecret = Math.random().toString(16).substring(2);
            pub.down.outgoing(mySecret);
        }

        return (pub = {
            reset: function () {
                mySecret = "";
                theirSecret = "";

                var cache = new Behavior.buffer();
                pub.up.reset();
                cache.up = pub.up;
                pub.up.down = cache;
                pub.up = cache;
                cache.down = pub;
                if (config.isHost) {
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
                        if (!config.isHost) {
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
                if (config.isHost) {
                    startVerification();
                }
            }
        });
    };
} (RPC.behavior, RPC._util);