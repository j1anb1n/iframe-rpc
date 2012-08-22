+function (util) {
    var reURI = /^((http.?:)\/\/([^:\/\s]+)(:\d+)*)/; // returns groups for origin(1), protocol (2), domain (3) and port (4) ;
    util.url = {
        getPort: function (url) {
            
        }
        ,getMainDomain: function (url) {
            var domain = util.url.getDomain(url);
            var re = /([^:\/\s\.]+)\.([^:\/\s\.]+)$/;
            if (domain && re.test(domain)) {
                return domain.match(re)[0];
            }
        }
        ,getDomain: function (url) {
            return url.toLowerCase().match(reURI)[3];
        }
        ,resolve: function (url) {
            
        }
        ,getOrigin: function (url) { // http://www.xxx.com
            var match = url.toLowerCase().match(reURI);
            return match[1];
        }
    };
} (RPC._util);