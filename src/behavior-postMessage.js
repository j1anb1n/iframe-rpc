+function (Behavior, util) {
    Behavior.postMessage = function (config) {
        var targetOrigin = util.url.getOrigin(config.remote),
            postFnHost   = { postMessage: function () {} };

        util.dom.on(window, 'message', function (event) {
            if (event.data.indexOf(config.channel) === 0) {  // {{ config.channel }}_{{ message }}
                var origin = util.url.getDomain(getOrigin(event));
                var message = event.data.substr(config.channel.length+1);

                if (util.checkACL(config.acl, origin)) {
                    pub.incoming(message);
                } else {
                    throw new Error(origin + ' is not in Access Control List!');
                }
            }
        });

        var pub = {
            incoming: function (message) {
                if (message === 'ready') {
                    pub.outgoing('ready');
                    pub.ready();
                } else {
                    pub.up.incoming(message);
                }
            }
            ,outgoing: function (message) {
                postFnHost.postMessage(config.channel + "_" + message, targetOrigin);
            }

            ,init: function () {
                if (config.isHost) {
                    var i = config.iframe;
                    postFnHost = ("postMessage" in i.contentWindow) ? i.contentWindow : i.contentWindow.document;
                } else {
                    postFnHost = ("postMessage" in window.parent) ? window.parent : window.parent.document;
                    util.dom.ready(function () {
                        pub.outgoing('ready');
                    });
                }
            }
            ,ready: function () {
                pub.up.ready();
            }
            ,reset: function () {

            }
            ,destroy: function () {
                config.iframe.parentNode.removeChild(config.iframe);
            }
        }
        return pub;
    }

    function getOrigin(event){
        if (event.origin) {
            // This is the HTML5 property
            return util.url.getOrigin(event.origin);
        }
        if (event.uri) {
            // From earlier implementations 
            return util.url.getOrigin(event.uri);
        }
        if (event.domain) {
            // This is the last option and will fail if the 
            // origin is not using the same schema as we are
            return location.protocol + "//" + event.domain;
        }
        throw "Unable to retrieve the origin of the event";
    }
} (RPC.behavior, RPC._util);