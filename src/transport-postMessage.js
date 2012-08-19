!function (Transport, util) {
    Transport.postMessageTransport = function (config) {
            var pub, frame, callerWindow, targetOrigin;

            function _window_onMessage(event){
                var origin = getOrigin(event);
                if (config.isHost && event.data === config.channel + "-reconnect") {
                    if (util.checkAcl(config.acl, util.path.getDomainName(origin))) {
                        targetOrigin = origin;
                        setTimeout(function () {
                            pub.up.callback(true);
                        }, 0);
                    } else {
                        throw new Error(getDomainName(origin) + ' is not in Access Control List!');
                    }
                }
                if (util.checkAcl(config.acl, util.path.getDomainName(origin)) && event.data.substring(0, config.channel.length + 1) == config.channel + " ") {
                    pub.up.incoming(event.data.substring(config.channel.length + 1), origin);
                }
            }

            return (pub = {
                outgoing: function(message, domain, fn){
                    callerWindow.postMessage(config.channel + " " + message, domain || targetOrigin);
                    if (fn) {
                        fn();
                    }
                },
                destroy: function(){
                    un(window, "message", _window_onMessage);
                    if (frame) {
                        callerWindow = null;
                        frame.parentNode.removeChild(frame);
                        frame = null;
                    }
                },
                onDOMReady: function(){
                    targetOrigin = getLocation(config.remote);
                    if (config.isHost) {
                        // add the event handler for listening
                        var waitForReady = function(event){  
                            if (event.data == config.channel + "-ready") {
                                // replace the eventlistener
                                callerWindow = ("postMessage" in frame.contentWindow) ? frame.contentWindow : frame.contentWindow.document;
                                un(window, "message", waitForReady);
                                on(window, "message", _window_onMessage);
                                setTimeout(function(){
                                    pub.up.callback(true);
                                }, 0);
                            }
                        };
                        on(window, "message", waitForReady);

                        // set up the iframe
                        apply(config.props, {
                            src: config.remote,
                            name: {
                                channel: config.channel,
                                type: 'provider',
                                remote: window.location.protocol + "//" + window.location.host,
                                protocol: "1" // 1 = PostMessage
                            }
                        });
                        frame = createFrame(config);
                        easyXDM.Fn.set(config.channel + '-get_iframe', function () {
                            return frame;
                        });
                    }
                    else {
                        // add the event handler for listening
                        on(window, "message", _window_onMessage);
                        callerWindow = ("postMessage" in window.parent) ? window.parent : window.parent.document;
                        var preConfig = GJ.windowName.get('easyxdm') || {};
                        if (preConfig.connected === true) {
                            callerWindow.postMessage(config.channel + "-reconnect", targetOrigin);
                        } else {
                            callerWindow.postMessage(config.channel + "-ready", targetOrigin);
                            preConfig.connected = true;
                            GJ.windowName.set('easyxdm', preConfig);
                        }
                        setTimeout(function(){
                            pub.up.callback(true);
                        }, 0);
                    }
                },
                init: function(){
                    whenReady(pub.onDOMReady, pub);
                }
            });
        };
        
    };
    util.lang.extend(Transport.postMessageTransport.prototype, util.eventEmiter, true);
    
    function getOrigin(event){
        if (event.origin) {
            // This is the HTML5 property
            return util.path.getLocation(event.origin);
        }
        if (event.uri) {
            // From earlier implementations 
            return util.path.getLocation(event.uri);
        }
        if (event.domain) {
            // This is the last option and will fail if the 
            // origin is not using the same schema as we are
            return location.protocol + "//" + event.domain;
        }
        throw "Unable to retrieve the origin of the event";
    }
}(simpleXDM.transport, simpleXDM._util);