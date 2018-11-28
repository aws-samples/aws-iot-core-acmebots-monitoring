var Bot = require('../src/bot');

DEFAULT_THING_NAME = 'Thing1';
DEFAULT_VERSION = '2.0';

var thingName = DEFAULT_THING_NAME;
if (process.argv.length > 2) {
    thingName = process.argv[2];
} 

var version = DEFAULT_VERSION;
if (process.argv.length > 3) {
    version = process.argv[3];
}

params = {thingName: thingName, version: version};
var bot = new Bot(params);