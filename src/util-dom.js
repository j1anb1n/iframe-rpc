!
function (util) {
    var root = util.dom = {};
    
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
        var nameString = util.JSON.stringify({'simplexdm': config.props.name});
        var frame = document.createElement("<iframe name='" + nameString + "'/>");

        util.windowName(frame).set('easyxdm', config.props.name);
        delete config.props.name;

        if (typeof config.container == "string") {
            config.container = document.getElementById(config.container);
        }

        if (!config.container) {
            // This needs to be hidden like this, simply setting display:none and the like will cause failures in some browsers.
            util.lang.extend(frame.style, {
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
        var src = config.props.src;
        config.props.src = 'javascript:false';

        // transfer properties to the frame
        util.lang.extend(frame, config.props, true);
        frame.border = frame.frameBorder = 0;
        frame.allowTransparency = true;
        config.container.appendChild(frame);

        // set the frame URL to the proper value (we previously set it to
        // "javascript:false" to work around the IE issue mentioned above)
        if (config.onLoad) {
            on(frame, "load", config.onLoad);
        }
        frame.src = src;
        config.props.src = src;

        return frame;
    };
} (simpleXDM._util);