'use strict'

var fs   = require('fs');
var path = require('path');
var iot      = require('aws-iot-device-sdk');
var Constants = require(`${__dirname}/constants`);
var MessageHandler = require(`${__dirname}/msgHandler`);


const VERISIGN_ROOT_CA_FILENAME = 'verisign-root-ca.pem'
const CA_CERT = fs.readFileSync(
    `${path.resolve(__dirname)}/${VERISIGN_ROOT_CA_FILENAME}`,'utf8');

var aws_iot_device = null;
var bot = null;

module.exports =  {
    bootstrap: function(caller) {
        bot = caller;
        var opts = {
            privateKey: Buffer.from(bot.props.certsProps.keyPair.PrivateKey, 'utf8'),
            clientCert: Buffer.from(bot.props.certsProps.certificatePem, 'utf8'),
            caCert: Buffer.from(CA_CERT, 'utf8'),
            clientId: bot.props.thingName,
            host: Constants.IOT_HOST,
        }
        aws_iot_device = iot.device(opts);

        aws_iot_device.on('connect', function() {
            bot.props.logger.info(`Subscribing to ${bot.props.cmdsTopic}`);
            aws_iot_device.subscribe(bot.props.cmdsTopic);
            aws_iot_device.on('message', function(t, payload) {
                const resp = MessageHandler.handle(payload.toString(), bot);
                aws_iot_device.publish(bot.props.cmdAckTopic, resp);
            });
        });

        aws_iot_device.on('connect', function() {
            bot.props.logger.info('aws-iot-event connect');
        });
        aws_iot_device.on('reconnect', function() {
            bot.props.logger.info('aws-iot-event reconnect');
        });
        aws_iot_device.on('close', function() {
            bot.props.logger.info('aws-iot-event close');
        });
        aws_iot_device.on('offline', function() {
            bot.props.logger.info('aws-iot-event offline')
        });
        aws_iot_device.on('error', function() {
            bot.props.logger.info('aws-iot-event error');
        });
        aws_iot_device.on('end', function() {
            bot.props.logger.info('aws-iot-event end');
        });

    },
    sendTelemetry: function (topic, data) {
        aws_iot_device.publish(topic, data);
    }
}