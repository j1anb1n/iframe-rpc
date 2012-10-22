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