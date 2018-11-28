var Constants = require(`${__dirname}/constants`);

function handleOtaUpdate(msg, bot) {
    var state = bot.props.telemetry;
    if (msg.version === undefined) {
        throw new Error('Missing required param: version');
    } else if (state.version === msg.version) {
        throw new Error(`I am already running version ${msg.version}`);
    } else {
        bot.setState({version: msg.version});
        return {status: 'ok'};
    }
}

function handleStartWork(msg, bot) {
    var state = bot.props.telemetry;
    if (state.status === Constants.WORKING_STATUS) {
        throw new Error('I am already working');
    } else {
        bot.setState({startWorkRequested: true});
        return {status: 'ok'};
    }
}

function handleStandBy(msg, bot) {
    var state = bot.props.telemetry;
    if (state.status === Constants.STANDBY_STATUS) {
        throw new Error('I am already on standby');
    } else {
        bot.setState({standByRequested: true});
        return {status: 'ok'};
    }
}

function handleEnableAutoCharging(bot) {
    var state = bot.props.telemetry
    if (state.autoChargingEnabled == true) {
        throw new Error('Auto charging is already enabled.');
    } else {
        bot.setState({autoChargingEnabled: true});
        return {status: 'ok'};
    } 
}

function handleDisableAutoCharging(bot) {
    var state = bot.props.telemetry
    if (state.autoChargingEnabled == false) {
        throw new Error('Auto charging is already disabled.');
    } else {
        bot.setState({autoChargingEnabled: false});
        return {status: 'ok'};
    }
}

function handleStartCharging(bot) {
    var state = bot.props.telemetry
    if (state.status == Constants.CHARGING_STATUS) {
        throw new Error('I am already charging.');
    } else {
        bot.setState({status: Constants.CHARGING_STATUS});
        return {status: 'ok'};
    }
}

function processCmd(msg, bot) {
    if (msg.cmd === Constants.OTA_UPDATE_CMD) {
        return handleOtaUpdate(msg, bot);
    } else if (msg.cmd === Constants.START_WORK_CMD) {
        return handleStartWork(msg, bot);
    } else if (msg.cmd === Constants.STAND_BY_CMD) {
        return handleStandBy(msg, bot);
    } else if (msg.cmd === Constants.ENABLE_AUTO_CHARGING_CMD) {
        return handleEnableAutoCharging(bot);
    } else if (msg.cmd === Constants.DISABLE_AUTO_CHARGING_CMD) {
        return handleDisableAutoCharging(bot);
    } else if (msg.cmd === Constants.START_CHARGING) {
        return handleStartCharging(bot);
    } else {
        throw new Error(`Unsupported cmd: ${msg.cmd}`);
    }
}

module.exports = class MessageHandler {

    static handle(stringMsg, bot) {
        var msg, error, resp;
        try {
            var msg = JSON.parse(stringMsg);
            resp = processCmd(msg, bot);
        } catch(err) {
            resp = { error: err.message };
        }
        return JSON.stringify(resp);
    }
}