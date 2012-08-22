+function (util) {
    // Window.name
    util.windowName = function (win) {
        if (win.name === "") {
            win.name = "{}";
        }

        return {
            set: function (key, value) {
                var obj;
                obj = util.JSON.parse(win.name);
                obj[key] = value;
                win.name = util.JSON.stringify(obj);
            },
            get: function (key) {
                return util.JSON.parse(win.name)[key];
            },
            remove: function (key) {
                var obj;
                obj = util.JSON.parse(win.name);
                var ret = obj[key];
                delete obj[key];
                win.name = util.JSON.stringify(obj);
                return ret;
            },
            clear: function () {
                var ret = win.name;
                win.name = "{}";
                return ret;
            },
            toString: function () {
                return win.name;
            },
            toJSON: function () {
                return win.name;
            }
        };
    };
    try {
        var window_name = util.windowName(window);
    } catch (ex) {
        var window_name = {};
    }
    util.lang.extend(util.windowName, window_name, true);
    // check Access Control List
    util.checkAcl = function(acl, domain){
        if (!acl || !acl.length) return true; //'none' to accept 'all'
        // normalize into an array
        if (typeof acl == "string") {
            acl = [acl];
        }
        var re, i = acl.length;
        while (i--) {
            re = acl[i];
            re = new RegExp(re.substr(0, 1) == "^" ? re : ("^" + re.replace(/(\*)/g, ".$1").replace(/\?/g, ".") + "$"));
            if (re.test(domain)) {
                return true;
            }
        }
        return false;
    };
    
    util.chainStack = function (stackElements){
        var stack = {
            incoming: function () { }
            ,outgoing: function (message) {
                stack.down.outgoing(message);
            }
            ,init: function () {
                stack.down.init();
            }
            ,ready: function () { }
            ,reset: function () { }
            ,destory: function () {
                stack.down.destory();
            }
        };
        for (var i = 0, len = stackElements.length; i < len; i++) {
            stackEl = stackElements[i];
            if (i !== 0) {
                stackEl.down = stackElements[i - 1];
            }
            if (i !== len - 1) {
                stackEl.up = stackElements[i + 1];
            } else {
                stackEl.up = stack;
                stack.down = stackEl;
            }
        }
        return stack;
    };
} (RPC._util);