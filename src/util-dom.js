(function (util) {
    var root = util.dom = {};
    var HAS_NAME_PROPERTY_BUG;
    // Event
    if (util.lang.has(window, 'addEventListener')) {
        root.on = function (target, type, listener) {
            target.addEventListener(type, listener, false);
        };
        root.off = function (target, type, listener) {
            target.removeEventListener(type, listener, false);
        };
    } else if (util.lang.has(window, 'attachEvent')) {
        root.on = function(target, type, listener){
            target.attachEvent("on" + type, listener);
        };
        root.off = function(target, type, listener){
            target.detachEvent("on" + type, listener);
        };
    } else {
        throw new Error("Browser not supported");
    }
    
    //isDomReady
    var domReadyQueue = [], readyState;
    var whenReady = function () {
        if (root.isReady) return;
        
        root.isReady = true;
        util.lang.each(domReadyQueue, function (fn) {
            setTimeout(fn, 0);
        });
        domReadyQueue = [];
    };
    root.isReady = false;
    root.ready = function (fn) {
        if (root.isReady) {
            setTimeout(fn, 0);
        } else {
            domReadyQueue.push(fn);
        }
    };
    
    if ("readyState" in document) {
        // If browser is WebKit-powered, check for both 'loaded' (legacy browsers) and
        // 'interactive' (HTML5 specs, recent WebKit builds) states.
        // https://bugs.webkit.org/show_bug.cgi?id=45119
        readyState = document.readyState;
        root.isReady = readyState == "complete" ||
                       (~ navigator.userAgent.indexOf('AppleWebKit/') &&
                       (readyState == "loaded" || readyState == "interactive"));
    } else {
        // If readyState is not supported in the browser, then in order to be able to fire whenReady functions apropriately
        // when added dynamically _after_ DOM load, we have to deduce wether the DOM is ready or not.
        // We only need a body to add elements to, so the existence of document.body is enough for us.
        root.isReady = !!document.body;
    }

    if (!root.isReady) {
        if (util.lang.has(window, "addEventListener")) {
            root.on(document, "DOMContentLoaded", whenReady);
        } else {
            root.on(document, "readystatechange", function(){
                if (document.readyState === "complete") {
                    whenReady();
                }
            });
            if (document.documentElement.doScroll && window === top) {
                var doScrollCheck = function(){
                    if (root.isReady) {
                        return;
                    }
                    // http://javascript.nwbox.com/IEContentLoaded/
                    try {
                        document.documentElement.doScroll("left");
                    } 
                    catch (e) {
                        setTimeout(doScrollCheck, 1);
                        return;
                    }
                    whenReady();
                };
                doScrollCheck();
            }
        }
        // A fallback to window.onload, that will always work
        root.on(window, "load", whenReady);
    }
    
    var createFrame = root.createFrame = function (config){
        // if (typeof HAS_NAME_PROPERTY_BUG === 'undefined') {
        //     testForNamePropertyBug();
        // }
        var iframe;
        var nameString = config.nameString || util.JSON.stringify({
            'RPC': {
                remote       : window.location.href,
                channel      : config.channel,
                protocol     : config.protocol,
                remoteDomain : document.domain,
                remoteOrigin : util.url.getOrigin(window.location.href),
                helper       : config.helper
            }
        });
        config.props = config.props || {};
        if (HAS_NAME_PROPERTY_BUG) {
            iframe = document.createElement("<iframe name='" + nameString + "'/>");
        } else {
            iframe = document.createElement("IFRAME");
            iframe.name = nameString;
        }
        if (typeof config.container == "string") {
            config.container = document.getElementById(config.container);
        }
        util.lang.extend(iframe.style, config.props.style, true);
        if (!config.container) {
            // This needs to be hidden like this, simply setting display:none and the like will cause failures in some browsers.
            util.lang.extend(iframe.style, {
                position: "absolute",
                top: "-2000px",
                // Avoid potential horizontal scrollbar
                left: "0px"
            }, true);
            config.container = document.body;
        }
        // HACK: IE cannot have the src attribute set when the frame is appended
        //       into the container, so we set it to "javascript:false" as a
        //       placeholder for now.  If we left the src undefined, it would
        //       instead default to "about:blank", which causes SSL mixed-content
        //       warnings in IE6 when on an SSL parent page.
        config.props.src = 'javascript:false';
        // transfer properties to the frame
        util.lang.extend(iframe, config.props, true);
        iframe.border = iframe.frameBorder = 0;
        iframe.allowTransparency = true;
        config.container.appendChild(iframe);
        // set the frame URL to the proper value (we previously set it to
        // "javascript:false" to work around the IE issue mentioned above)
        if (config.onLoad) {
            util.dom.on(iframe, "load", config.onLoad);
        }
        iframe.src = config.remote;
        return iframe;
    };


    // This tests for the bug in IE where setting the [name] property using javascript causes the value to be redirected into [submitName].
    function testForNamePropertyBug(){
        var form = document.body.appendChild(document.createElement("form")), input = form.appendChild(document.createElement("input"));
        input.name =  "TEST" + Math.random().toString(16).substring(2); // in order to avoid caching issues
        HAS_NAME_PROPERTY_BUG = input !== form.elements[input.name];
        document.body.removeChild(form);
    }

}) (RPC._util);