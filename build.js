var uglifyjs = require('uglify-js');
var fs = require('fs');

var files = [
    'simpleXDM.js'
    ,'util-lang.js'
    ,'util-dom.js'
    ,'util-event.js'
    ,'util-json.js'
    ,'behavior-verify.js'
    ,'behavior-queue.js'
    ,'behavior-reliable.js'
    ,'behavior-cache.js'
    ,'transport-hash.js'
    ,'transport-postMessage.js'
];

var code = "";
files.forEach(function (file) {
    code += (gen_code(fs.readFileSync('src/'+file).toString()) + "\n");
});
fs.writeFileSync('dist/simpleXDM.js', code);

function gen_code (code) {
    var ast = uglifyjs.parser.parse(code); // parse code and get the initial AST
    ast = uglifyjs.uglify.ast_mangle(ast); // get a new AST with mangled names
    ast = uglifyjs.uglify.ast_squeeze(ast); // get an AST with compression optimizations
    return uglifyjs.uglify.gen_code(ast); // compressed code here
}