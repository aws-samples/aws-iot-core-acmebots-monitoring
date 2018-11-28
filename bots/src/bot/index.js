'use strict'

var fs   = require('fs');
var path = require('path');

var BotCore = require(`${__dirname}/core`);
const BotLogger = require(`${__dirname}/logger`);
var Constants = require(`${__dirname}/constants`);
var Iot = require(`${__dirname}/iot`);

const DEFAULT_TELEMETRY_INTERVAL = 15000 // in milliseconds
const DEFAULT_VERSION = '1.0'
const DEFAULT_BATTERY_LIFE = 50;
const DEFAULT_STATUS = Constants.CHARGING_STATUS;

function initProps(obj, opts) {
    obj.props = opts;
    const placeholder = Constants.DEVICE_ID_PLACEHOLDER;
    obj.props.telemetryTopic = opts.telemetryTopic || Constants.TELEMETRY_TOPIC_TEMPLATE.replace(placeholder, obj.props.thingName);
    obj.props.cmdsTopic = opts.cmdsTopic || Constants.CMD_TOPIC_TEMPLATE.replace(placeholder, obj.props.thingName);;
    obj.props.cmdAckTopic = `${obj.props.cmdsTopic}/${Constants.ACK_SUFFIX}`;
    obj.props.certsProps = null;
    obj.props.telemetry = {
        status: opts.status || DEFAULT_STATUS,
        batteryLife: opts.batteryLife || DEFAULT_BATTERY_LIFE,        
        version: opts.version || DEFAULT_VERSION,
        startWorkRequested: false,
        standByRequested: false,
        autoChargingEnabled: true
    }
    obj.props.logger = BotLogger.getLogger(obj.props.thingName);
}

module.exports = class Bot {

    constructor(opts={}) {
        initProps(this, opts);

        //
        // Load keys and certs and then start the bot.
        //
        var _this = this;
        BotCore.bootstrap(this.props.thingName, function(err, data) {
            if(err) {
                console.log(err, err.stack);
                return;
            } else {
                _this.props.certsProps = data;
                _this.start();
            }
        });
    }

    start() {
        Iot.bootstrap(this);
        var _this = this;
        setInterval(
            function() {
                BotCore.updateState(_this.props.telemetry, _this.props.logger);
            }, 
            1000
        );
        _this.props.logger.info(`Will send telemetry data every ${DEFAULT_TELEMETRY_INTERVAL} seconds to ${_this.props.telemetryTopic}`);
        setInterval(
            function() {
                var arr = BotCore.getTelemetryData();
                var data = { telemetry: arr};
                Iot.sendTelemetry(_this.props.telemetryTopic, JSON.stringify(data) );
            }, 
            DEFAULT_TELEMETRY_INTERVAL
        );
    }

    setState(props) {
        var state = this.props.telemetry;
        for (var key in props) {
            if (state.hasOwnProperty(key)) {
                state[key] = props[key];
            }
        }
    }
}