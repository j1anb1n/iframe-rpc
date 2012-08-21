var uglifyjs = require('uglify-js');
var fs = require('fs');

var files = [
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
    
    ,'transport-hash.js'
    ,'transport-postMessage.js'
];

var C = "";
var c = "";
var code = "";
files.forEach(function (file) {
    code = fs.readFileSync('src/'+file).toString();
    C += code + "\n";
    c += gen_code(code) + "\n";
});
fs.writeFileSync('dist/RPC-debug.js',C);
fs.writeFileSync('dist/RPC.js',c);
C = "GJ.add('js/util/rpc/rpc.js', [], function (require, exports, module) {\n" + C + "\n});";
fs.writeFileSync('/Users/jianbin/developer/ganji/ganji_sta/src/js/util/rpc/rpc.js', C);
function gen_code (code) {
    var ast = uglifyjs.parser.parse(code); // parse code and get the initial AST
    ast = uglifyjs.uglify.ast_mangle(ast); // get a new AST with mangled names
    ast = uglifyjs.uglify.ast_squeeze(ast); // get an AST with compression optimizations
    return uglifyjs.uglify.gen_code(ast); // compressed code here
}