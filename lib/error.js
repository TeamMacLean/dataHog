var log = require('./log');

/**
 *
 * @param err
 * @param res
 * @returns {*}
 */
module.exports = function error(err, res) {
    if (res) {
        log.error(err);
        return res.render('error', {error: err});
    }
};