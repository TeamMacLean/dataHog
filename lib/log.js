const Log = {};


Log.log = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
        inputs[_key] = arguments[_key];
    }
    console.log(inputs.join(' '));
};
Log.error = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
        inputs[_key] = arguments[_key];
    }
    console.log(inputs.join(' '));
};
Log.success = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
        inputs[_key] = arguments[_key];
    }
    console.log(inputs.join(' '));
};
Log.warn = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
        inputs[_key] = arguments[_key];
    }
    console.log(inputs.join(' '));
};

module.exports = Log;