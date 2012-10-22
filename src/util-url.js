(function (util) {
    var reURI = /^((https?:)\/\/([^:\/\s]+)(:\d+)*)/; // returns groups for origin(1), protocol (2), domain (3) and port (4) ;
    util.url = {
        getPort: function (url) {
            
        },
        getMainDomain: function (url) {  // www.xxx.com => xxx.com
            var domain = util.url.getDomain(url);
            var re = /([^:\/\s\.]+)\.([^:\/\s\.]+)$/;
            if (domain && re.test(domain)) {
                return domain.match(re)[0];
            }
        },
        getDomain: function (url) {  // www.xxx.com
            var match = url.toLowerCase().match(reURI);
            if (match) {
                return match[3];
            }
        },
        resolve: function (url) {
            
        },
        getOrigin: function (url) { // http://www.xxx.com
            var match = url.toLowerCase().match(reURI);
            if (match) {
                return match[1];
            }
        },
        removeHash: function (url) {
            var indexOf = url.indexOf('#');
            return url.substr(0, indexOf);
        }
    };
})(RPC._util);