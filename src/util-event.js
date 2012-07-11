!function (util) {
    util.eventEmiter = function () {
        var callbacks = {};
        return (pub = {
            on: function (event, callback, scope) {
                callbacks[event] = callbacks[event] || [];
                callbacks[event].push({
                    fn: callback
                    ,scope: scope
                });
            }
            ,once: function (event, callback, scope) {
                callbacks[event] = callbacks[event] || [];
                callbacks[event].push({
                    fn: callback
                    ,scope: scope
                    ,type: 1 // if (cb.type) { call_once }
                });
            }
            ,off: function (event, callback) {
                if (!callbacks) {
                    callbacks[event] = []; //remove all events
                }
                
                var cbs = callbacks[event] = callbacks[event] || [], cb, temp = [];
                while(cbs.length) {
                     cb = cbs.shift();
                     if (cb.fn !== callback) {
                         temp.push(cb);
                     }
                }
                callbacks[event] = temp;
            }
            ,emit: function (event) {
                var cbs = callbacks[event] = callbacks[event] || [], cb, temp = [];
                var args = Array.prototype.slice.call(arguments, 1);
                while(cbs.length) {
                    cb = cbs.shift();
                    cb.fn.apply(cb.scope || this, [event].concat(args));
                    if (!cb.type) {
                        temp.push(cb);
                    }
                }
                callbacks[event] = temp;
            }
            ,addListener: pub.on
            ,removeListener: pub.off
        });
    };
}(simpleXDM._util);