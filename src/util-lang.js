+function (util) {
    var AP = Array.prototype, OP = Object.prototype, FP = Function.prototype;
    
    var slice               = AP.slice
        ,nativeForEach      = AP.forEach;

    var each = function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj) {
                    iterator.call(context, obj[i], i, obj);
                }
            }
        } else {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        }
    };
    
    util.lang = {
        isUndefined: function(obj) {
            return obj === void 0;
        }
        ,isArray: function (obj) {
            return Object.prototype.toString.call(o) === '[object Array]';
        }
        ,isFunction: function (obj) {
            return typeof obj === 'function';
        }
        ,extend: function (obj, ext, overwrite) {
            for (var prop in ext) {
                if (overwrite) {
                    obj[prop] = ext[prop];
                } else if (!obj.hasOwnProperty(prop)){
                    obj[prop] = ext[prop];
                }
            }
            return obj;
        }
        ,has: function (obj, key) {
            var t = typeof obj[key];
            return t == 'function' ||
            (!!(t == 'object' && obj[key])) ||
            t == 'unknown';
        }
        ,each: each
        ,forEach: each
    };
} (RPC._util);