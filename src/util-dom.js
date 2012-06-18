!
function (util) {
    util.dom = {};
    
    // Event
    if (window.hasOwnProperty('addEventListener')) {
        util.dom.on = function (target, type, listener) {
            target.addEventListener(type, listener, false);
        };
        util.dom.off = function (target, type, listener) {
            target.removeEventListener(type, listener, false);
        };
    } else if (window.hasOwnProperty('attachEvent')) {
        util.dom.on = function(target, type, listener){
            target.attachEvent("on" + type, listener);
        };
        util.dom.off = function(target, type, listener){
            target.detachEvent("on" + type, listener);
        };
    } else {
        throw new Error("Browser not supported");
    }
} (simpleXDM._util);