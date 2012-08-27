+function (Behavior, util) {
    Behavior.hash = function (config) {
        var pub, hashWriter, hashReader, baseUrl;
        var messageID = 0, lastMsg, timer;
        return (pub = {
            incoming: function (message) {
                if (message === 'ready') {
                    pub.ready();
                }
            }
            ,outgoing: function (message) {
                var url = baseUrl + "#" + (messageID++) + "_" + message;
                hashWriter.contentWindow.location = url;
            }

            ,init: function () {
                if (config.isHost) {
                    window.RPC_Fn.set(config.channel+"helper_ready", function (win) {
                        hashReader = win;
                        hashWriter = config.iframe;
                        baseUrl = config.remote;
                        startPolling();
                        pub.outgoing('ready');
                    });
                } else {
                    hashWriter = util.dom.createFrame({
                        nameString: config.channel+"helper_ready"
                        ,remote: config.helper
                    });
                    hashReader = window;
                    baseUrl = config.helper;
                    startPolling();
                }
            }
            ,ready: function () {
                pub.incoming = function (message) {
                    pub.up.incoming(message);
                }
                if (!config.isHost) {
                    pub.outgoing('ready');
                }
                pub.up.ready();
            }
            ,reset: function () {
                pub.up.reset();
            }
            ,destroy: function () {
                hashWriter.parentNode.removeChild(hashWriter);
            }
        });

        function polling() {
            if (!hashReader) { return; }
            var href = hashReader.location.href, hash = "", indexOf = href.indexOf("#");
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
}(RPC.behavior, RPC._util);