var Errors = {};

Errors.show = function (req, res) {
  res.render('error', {title: '404', error: 'I can\'t even'});
};

module.exports = Errors;