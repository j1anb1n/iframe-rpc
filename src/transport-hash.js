!function (Transport) {
    Transport.hashTransport = function (config) {
        var pub;
        var me = this, isHost, _timer, pollInterval, _lastMsg, _msgNr, _listenerWindow, _callerWindow;
        var useParent, _remoteOrigin, helperReady = false, send;

        function sendMessage(message){
            (function test() {
                if (helperReady) {
                    if (!_callerWindow) {
                        return;
                    }
                    var url = config.remote + "#" + (_msgNr++) + "_" + message;
                    ((isHost || !useParent) ? _callerWindow.contentWindow : _callerWindow).location = url;
                } else {
                    setTimeout(test, 50);
                }
            }());
        }
        send = _sendMessage;
        function onMessage(message) {
            if (message.substr(0, 10) === "reconnect_") {
                var reconnConfig = GJ.jsonDecode(message.substr(10, message.length-1));
                if (checkAcl(config.acl, getDomainName(reconnConfig.remote))) {
                    config.remote = reconnConfig.remote;
                    _remoteOrigin = reconnConfig.remote;
                    pub.up.reset();
                } else {
                    throw new Error(getDomainName(reconnConfig.remote) + ' is not in Access Control List!');
                }
            } else {
                pub.up.incoming(message, _remoteOrigin);
            }
        }
        function _handleHash(hash){
            _lastMsg = hash;
            var message = _lastMsg.substring(_lastMsg.indexOf("_") + 1);        
            onMessage(message);
        }
        /**
        * Checks location.hash for a new message and relays this to the receiver.
         * @private
         */
        function _pollHash(){
            if (!_listenerWindow) {
                return;
            }
            var href = _listenerWindow.location.href, hash = "", indexOf = href.indexOf("#");
            if (indexOf != -1) {
                hash = href.substring(indexOf);
            }
            if (hash && hash != _lastMsg) {
                _handleHash(hash);
            }
        }

        function _attachListeners(){
            _timer = setInterval(_pollHash, pollInterval);
        }
        function _removeListeners(){
            clearInterval(_timer);
        }
        return (pub = {
            outgoing: function(message, domain){
                send(message);
            },
            destroy: function(){
                window.clearInterval(_timer);
                if (isHost || !useParent) {
                    _callerWindow.parentNode.removeChild(_callerWindow);
                }
                _callerWindow = null;
            },
            onDOMReady: function(){
                isHost = config.isHost;
                pollInterval = config.interval;
                _lastMsg = "#" + config.channel;
                _msgNr = 0;
                useParent = config.useParent;
                _remoteOrigin = getLocation(config.remote);
                var callback;
                if (isHost) {
                    apply(config.props, {
                        src: config.remote,
                        name: {
                            channel: config.channel,
                            remoteDomain: document.domain,
                            remote: config.helper,
                            protocol: '0'
                        }
                    });
                    _callerWindow = createFrame(config);
                    callback = true;
                    easyXDM.Fn.set(config.channel + "-helper_ready", function (listener) {
                        _listenerWindow = listener;
                        helperReady = true;
                        _attachListeners();
                        if (callback) {
                            pub.up.callback(true);
                            callback = false;
                        }
                    });
                    easyXDM.Fn.set(config.channel + "-helper_unload", function (listener) {
                        _removeListeners();
                        helperReady = false;
                    });
                    easyXDM.Fn.set(config.channel + "-use_sameorigin", function (sendFn, remoteWindow) {
                        send = sendFn;
                        if (callback) {
                            pub.up.callback(true);
                            callback = false;
                        }
                        on(remoteWindow, 'unload', function () {
                            GJ.log('easyXDM::HashTransport - Reset send method');
                            send = _sendMessage;
                        });

                        return function (msg) {
                            onMessage(msg);
                        };
                    });
                    easyXDM.Fn.set(config.channel + "-get_iframe", function () {
                        return _callerWindow;
                    });
                }
                else {
                    _listenerWindow = window;
                    _attachListeners();
                    helperReady = true;
                    var preConfig = GJ.windowName.get('easyxdm') || {};
                    callback = function () {
                        if (preConfig.connected) {
                            send('reconnect_' + serializer.stringify({
                                remote: window.location.href
                            }));
                        }
                        preConfig.connected = true;
                        GJ.windowName.set('easyxdm', preConfig);
                    };
                    if (config.isSameOrigin) {
                        setTimeout(function () {
                            send = getParentObject().Fn.get(config.channel + "-use_sameorigin") (function (msg) {
                                onMessage(msg, _remoteOrigin);
                            }, window);
                            callback();
                            pub.up.callback(true);
                        }, 0);
                    } else {
                        apply(config, {
                            props: {
                                src: config.remote,
                                name: config.channel
                            },
                            onLoad: function(){
                                callback();
                                pub.up.callback(true);
                            }
                        });
                        _callerWindow = createFrame(config);
                    }
                }
            },
            init: function(){
                whenReady(pub.onDOMReady, pub);
            }
        });
    };
}(simpleXDM.transport);