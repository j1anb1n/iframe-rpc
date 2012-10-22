(function (util) {
    util.eventEmiter = function (that) {
        var callbacks = {};

        that.on = function (event, callback, scope) {
            callbacks[event] = callbacks[event] || [];
            callbacks[event].push({
                fn    : callback,
                scope : scope
            });
        };
        that.once = function (event, callback, scope) {
            callbacks[event] = callbacks[event] || [];
            callbacks[event].push({
                fn    : callback,
                scope : scope,
                type  : 1 // if (cb.type) { call_once }
            });
        };
        that.off = function (event, callback) {
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
        };
        that.emit = function (event) {
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
        };
        that.addListener    = that.on;
        that.removeListener = that.off;
    };
}) (RPC._util);