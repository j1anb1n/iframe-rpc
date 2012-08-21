+function (Transport, util) {
    var channelCounter = 0;
    Transport.postMessageTransport = function (config) {
        var self = this;
        config.channel = 'RPC_CHANNEL_' + (channelCounter++);
        var targetOrigin = util.url.getOrigin(config.remote);
        var postFn = function () {};
        util.eventEmiter(this);

        this.send = function (message) {
            postFnHost.postMessage(config.channel + '_' + message, targetOrigin);
        }

        util.dom.on(window, 'message', function (event) {
            console.log(window.location.href, 'on message', event.data);
            if (event.data.indexOf(config.channel) === 0) {
                var origin = util.url.getDomain(getOrigin(event));
                var message = event.data.substr(config.channel.length+1); // CHANNEL_ID_0_xxxxxx
                if (util.checkAcl(config.acl, origin)) {
                    if (message === 'ready') {
                        self.emit('ready');
                        if (config.isHost) {
                            self.send('ready');
                        }
                    } else {
                        self.emit('message', message);
                    }
                } else {
                    throw new Error(origin + ' is not in Access Control List!');
                }
            }
        });
        this.init = function () {
            if (config.isHost) {
                var iframe = util.dom.createFrame(config);
                postFnHost = ("postMessage" in iframe.contentWindow) ? iframe.contentWindow : iframe.contentWindow.document;
            } else {
                postFnHost = ("postMessage" in window.parent) ? window.parent : window.parent.document;
                self.send('ready');
            }
        }
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
}(RPC.transport, RPC._util);