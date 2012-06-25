!function (Behavior) {
    Behavior.reliable = function(config){
        var pub, callback;
        var idOut = 0, idIn = 0, currentMessage = "";

        return (pub = {
            incoming: function(message, origin){
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
                    pub.down.outgoing(ack[1] + "," + idOut + "_" + currentMessage, origin);
                    if (idIn != ack[1]) {
                        idIn = ack[1];
                        pub.up.incoming(message, origin);
                    }
                }

            },
            outgoing: function(message, origin, fn){
                currentMessage = message;
                callback = fn;
                pub.down.outgoing(idIn + "," + (++idOut) + "_" + message, origin);
            },
            reset: function(config) {
                idOut = 0;
                idIn = 0;
                pub.up.reset(config);
            }
        });
    };
}(simpleXDM.behavior);