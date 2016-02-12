var airdale = require('airdale');

module.exports = function error(err, req, res) {
  if (req && res) {
    return res.render('error', {error: err});
  }

  airdale.post('wookoouk', airdale.types.error, err)
    .then(function (responseCode, body) {
      if (responseCode === 200) {
        console.log('error sent ok');
        console.log(body);
      }
    })
    .error(function (error) {
      console.error('failed to post error', error);
    });

};