+function (Behavior) {
    Behavior.reliable = function(config){
        var pub, callback;
        var idOut = 0, idIn = 0, currentMessage = "";

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
            }
            ,outgoing: function(message, cb){
                currentMessage = message;
                callback = cb;
                pub.down.outgoing(idIn + "," + (++idOut) + "_" + message);
            }
            
            ,init: function () {
                pub.down.init();
            }
            ,reset: function() {
                idOut = 0;
                idIn = 0;
                idOut = 0;
                idIn = 0;
                currentMessage = "";
                callback = null;
                pub.up.reset();
            }
            ,ready: function () {
                pub.up.ready();
            }
            ,destroy: function () {
                idOut = 0;
                idIn = 0;
                currentMessage = "";
                callback = null;
                pub.down.destory();
            }
        });
    };
} (RPC.behavior);