var Config = require(`${__dirname}/../config`);

const DEVICE_ID_PLACEHOLDER = '<deviceId>';

module.exports = {    
    STANDBY_STATUS : 'standby',
    OFF_STATUS     : 'off',
    CHARGING_STATUS: 'charging',
    WORKING_STATUS : 'working',

    OTA_UPDATE_CMD            : 'otaUpdate',
    START_WORK_CMD            : 'startWork',
    STAND_BY_CMD              : 'standby',
    ENABLE_AUTO_CHARGING_CMD  : 'enableAutoCharging',
    DISABLE_AUTO_CHARGING_CMD : 'disableAutoCharging',
    START_CHARGING            : 'startCharging',

    REGION: Config.region,
    S3_BUCKET: Config.iotKeysAndCertsBucket,
    IOT_THINGS_TABLE: Config.iotThingsTable,
    IOT_HOST: Config.iotEndpointAddress,

    DEVICE_ID_PLACEHOLDER   : DEVICE_ID_PLACEHOLDER,
    TELEMETRY_TOPIC_TEMPLATE: `myThings/${DEVICE_ID_PLACEHOLDER}/telemetry`,
    CMD_TOPIC_TEMPLATE      : `myThings/${DEVICE_ID_PLACEHOLDER}/cmds`,
    ACK_SUFFIX              : 'ack',
}
