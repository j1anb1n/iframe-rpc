var xdm = SimpleXDM({
    url: 'http://www.ganji.com/login.html'
    ,helper: 'http://www.ganji.com/name.html'
    ,method: {
        
    }
});

xdm.set('close', function () {
    
});
xdm('resize', width, height, function () {
    
});

## in iframe

var xdm = SimpleXDM.getParent();
xdm();