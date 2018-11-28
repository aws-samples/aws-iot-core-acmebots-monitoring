var fs = require('fs');

class MyUtils {

    readFile(path) {
        return fs.readFileSync(path, 'utf8');
    }

    readJsonFile(path) {
        var str = this.readFile(path);
        return JSON.parse(str);
    }

}
module.exports = new (MyUtils)