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