import Config from './config.json';

export default {
    region: Config.region,
    IdentityPoolId: Config.IdentityPoolId,
    UserPoolId: Config.UserPoolId,
    ReactAppClientId: Config.ReactAppClientId,
    iotThingsTable: Config.iotThingsTable,
    IotProvisionThingLambdaFunctionQualifiedArn: Config.IotProvisionThingLambdaFunctionQualifiedArn,
    IotRemoveThingLambdaFunctionQualifiedArn: Config.IotRemoveThingLambdaFunctionQualifiedArn,
    iotEndpointAddress: Config.iotEndpointAddress,
    IotPolicyName: Config.AcmeBotsGuiIotPolicy,
};