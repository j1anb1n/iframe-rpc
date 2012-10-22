(function (Behavior, util) {
    Behavior.hash = function (config) {
        var pub, hashWriter, hashReader, baseUrl, lastMsg, timer;
        var isReady = false;
        return (pub = {
            incoming: function (message, remote) {
                if (message === 'ready') {
                    pub.ready(remote);
                } else {
                    pub.up.incoming(message);
                }
            },
            outgoing: function (message) {
                var url = baseUrl + "#_" + message;
                hashWriter.contentWindow.location = url;
            },
            init: function () {
                if (config.isHost) {
                    window.RPC_Fn.set(config.channel+"helper_ready", function (win, remote) {
                        if (util.checkACL(config.acl, remote)) {
                            hashReader = win;
                            hashWriter = config.iframe;
                            baseUrl    = remote;
                            startPolling();
                            util.dom.on(win, 'unload', function () {
                                stopPolling();
                            });
                        }
                    });
                } else {
                    hashWriter = util.dom.createFrame({
                        nameString : config.channel+"helper_ready"+" "+window.location.href,
                        remote     : config.helper,
                        onLoad     : function () {
                            baseUrl = config.helper;
                            pub.outgoing('ready');
                        }
                    });
                    hashReader = window;
                    startPolling();
                }
            },
            ready: function () {
                if (config.isHost) {
                    pub.outgoing('ready');
                }
                pub.up.ready();
            },
            destroy: function () {
                if (hashWriter && hashWriter.parentNode && hashWriter.parentNode.removeChild) {
                    hashWriter.parentNode.removeChild(hashWriter);
                }
            }
        });

        function polling() {
            if (!hashReader) { return; }

            var href    = hashReader.location.href,
                hash    = "", 
                indexOf = href.indexOf("#");

            if (indexOf != -1) {
                hash = href.substring(indexOf);
            }
            if (hash && hash !== lastMsg) {
                lastMsg = hash;
                var message = lastMsg.substring(lastMsg.indexOf("_") + 1);
                pub.incoming(message);
            }
        }
        function startPolling () {
            timer = setInterval(polling, config.interval);
        }
        function stopPolling () {
            clearInterval(timer);
        }
    };
}) (RPC.behavior, RPC._util);