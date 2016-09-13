const airdale = require('airdale');
airdale.setServer('http://ascowardswake.com:1337');

const Log = {};


Log.log = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
        inputs[_key] = arguments[_key];
    }
    console.log(inputs.join(' '));
    airdale.post('wookoouk', 'DataHog', airdale.types.info, inputs.join(' '));
};
Log.error = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
        inputs[_key] = arguments[_key];
    }
    console.log(inputs.join(' '));
    airdale.post('wookoouk', 'DataHog', airdale.types.error, inputs.join(' '));
};
Log.success = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
        inputs[_key] = arguments[_key];
    }
    console.log(inputs.join(' '));
    airdale.post('wookoouk', 'DataHog', airdale.types.success, inputs.join(' '));
};
Log.warn = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
        inputs[_key] = arguments[_key];
    }
    console.log(inputs.join(' '));
    airdale.post('wookoouk', 'DataHog', airdale.types.warning, inputs.join(' '));
};

module.exports = Log;