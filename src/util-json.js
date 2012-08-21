+function (util) {
    util.JSON = {
        stringify: JSON.stringify
        ,parse: JSON.parse
    };
} (RPC._util);