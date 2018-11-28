
var AWS = require('aws-sdk/global');
var Iot = require('aws-sdk/clients/iot');
var Config = require('../src/config/config.json');

AWS.config.region = Config.region;

var iot = new Iot();

const policyName = Config.AcmeBotsGuiIotPolicy;
var params = {
    policyName: policyName
};
iot.listPolicyPrincipals(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
        data.principals.forEach(function(principal){
            var detachParams = {
                policyName: policyName,
                principal: principal
            };
            iot.detachPrincipalPolicy(detachParams, function(err2, data2){
                if (err2) console.log(err2, err2.stack);
                else {
                    console.log(`Successfully detached ${principal} from ${policyName}`)
                }
            });
        })
    }
});

// var params = {
//     policyName: Config.AcmeBotsGuiIotPolicy,
//     principal: ?,
// };
// iot.detachPrincipalPolicy(params, function(err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else     console.log(data);           // successful response
// });