module.exports = function(grunt) {
    // Project configuration.
    var src = [
        'RPC.js'
        ,'util-lang.js'
        ,'util-url.js'
        ,'util-event.js'
        ,'util-json.js'
        ,'util-dom.js'
        ,'util.js'
        
        ,'behavior-verify.js'
        ,'behavior-queue.js'
        ,'behavior-reliable.js'
        ,'behavior-buffer.js'
        ,'behavior-hash.js'
        ,'behavior-postMessage.js'
        ,'behavior-sameorigin.js'

        ,'transport.js'
    ].map(function (file) {
        return '../src/' + file;
    });

    grunt.initConfig({
        lint: {
            all: src
        },
        jshint: {
            options: {
                browser: true
            }
        },
        concat: {
            "rpc.js": {
                src: src,
                dest: '../dist/rpc.js'
            },
        },
        min: {
            "rpc-min.js": {
                src: src,
                dest: '../dist/rpc-min.js',
                separator: "\n"
            }
        }
    });
    grunt.registerTask('default', 'lint concat min');
};