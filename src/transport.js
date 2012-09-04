+function (RPC, util) {
    RPC.Transport = function (config) {
        var me = this, stack = [];
        util.eventEmiter(this);

        var query = {}, transport;
        
        if (!config.props) {
            config.props = {};
        }

        if (config.isHost) {
            if (config.remote.substr(0, 4) !== 'http') {
                config.remote = window.location.protocol + "//" + window.location.host + config.remote;
            }
            if (typeof config.isSameOrigin === 'undefined') {
                config.isSameOrigin = util.url.getMainDomain(window.location.href) === util.url.getMainDomain(config.remote);
            }

            if (config.isSameOrigin) {
                config.protocol = "0";
            } else if (window.postMessage || document.postMessage) {
                /*
                 * This is supported in IE8+, Firefox 3+, Opera 9+, Chrome 2+ and Safari 4+
                 */
                config.protocol = "1";
            } else {
                /*
                 * This is supported in all browsers where [window].location is writable for all
                 * The resize event will be used if resize is supported and the iframe is not put
                 * into a container, else polling will be used.
                 */
                config.protocol = "2";
            }
        } else {
            query = util.windowName.get('RPC');
            if (!query) {
                throw new Error('arguments missing');
            }
            config.channel  = query.channel;
            config.protocol = query.protocol;
            config.remote   = query.remote;
            config.helper   = query.helper;
            if (query.remoteDomain === document.domain) {
                config.isSameOrigin = true;
            } else {
                config.isSameOrigin = false;
            }
        }
        if (!util.checkACL(config.acl, util.url.getDomain(config.remote))) {
            throw new Error("Access denied for " + config.remote);
        }
        switch (config.protocol) {
            case "0":
                stack = [new RPC.behavior.sameorigin(config)];
                break;
            case "1":
                stack = [new RPC.behavior.postMessage(config)];
                break;
            case "2":
                util.lang.extend(config, {
                    interval: 20
                });
                stack = [new RPC.behavior.hash(config)
                        ,new RPC.behavior.reliable(config)
                        ,new RPC.behavior.queue(config)
                        ,new RPC.behavior.verify(config)];
                break;

        }
        stack.push(new RPC.behavior.buffer(config));
        stack = util.chainStack(stack);

        this.send = function (message) {
            stack.outgoing(message);
        }

        this.init = function () {
            if (config.isHost) {
                config.iframe = util.dom.createFrame(config);
            }
            stack.init();
            stack.incoming = function (message) {
                me.emit('message', message);
            }
            stack.ready = function () {
                me.emit('ready');
            }
        }
        this.destroy = function () {
            stack.destroy();
        }
    }
}(RPC, RPC._util);