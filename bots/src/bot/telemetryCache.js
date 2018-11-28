const MAX_SIZE = 120;  // 2 mins
var store_arr = [];

module.exports =  {
    recordTelemetry: function(data, maxSize=MAX_SIZE) {
        store_arr.push(data);
        while(store_arr.length > maxSize) {
            store_arr.shift();
        }
    },
    flushTelemetry: function() {
        var shallowCopy = store_arr.slice();
        store_arr = [];
        return shallowCopy;
    }
}