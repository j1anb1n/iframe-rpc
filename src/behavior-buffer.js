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