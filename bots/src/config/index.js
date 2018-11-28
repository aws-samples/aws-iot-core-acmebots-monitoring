var config = require('./config.json');
                    
module.exports = {
  region: config.region,
  iotThingsTable: config.iotThingsTable,
  iotKeysAndCertsBucket: config.iotKeysAndCertsBucket,
  iotEndpointAddress: config.iotEndpointAddress,
};
