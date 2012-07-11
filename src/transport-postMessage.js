!function (Transport, util) {
    Transport.postMessageTransport = function (config) {
        
    };
    util.lang.extend(Transport.postMessageTransport.prototype, util.eventEmiter, true);
}(simpleXDM.transport, simpleXDM._util);