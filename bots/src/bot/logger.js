const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

module.exports = {
    getLogger: function (botName) {
        return createLogger({
            transports: [
                new transports.Console()
            ],
            format: combine(
                label({ label: botName }),
                timestamp(),
                myFormat
                )
        });
    }
}