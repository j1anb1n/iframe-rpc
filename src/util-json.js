+function (util) {
    util.JSON = {
        stringify: GJ.jsonEncode
        ,parse: GJ.jsonDecode
    }
    // util.JSON = {
    //     stringify: JSON.stringify
    //     ,parse: JSON.parse
    // };
} (RPC._util);