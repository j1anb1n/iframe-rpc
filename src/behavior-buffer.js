+function (Behavior, util) {
    Behavior.buffer = function (config) {
        var messageBuffer = [];

        var pub = {
            incoming: function (message) {
                pub.up.incoming(message);
            }
            ,outgoing: function (message) {
                messageBuffer.push(message);
            }

            ,init: function () {
                pub.down.init();
            }
            ,ready: function () {
                stackReady = true;
                util.lang.each(messageBuffer, function (message) {
                    pub.down.outgoing(message);
                });
                // remove frome stack
                pub.incoming = pub.up.incoming;
                pub.outgoing = pub.down.outgoing;
                
                pub.up.ready();
            }
            ,reset: function () {

            }
            ,destory: function () {

            }
        }
        return pub;
    };
} (RPC.behavior, RPC._util);