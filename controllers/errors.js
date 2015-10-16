var Errors = {};

Errors.show = function (req, res) {
  res.status(404).render('error', {title: '404', error: 'I can\'t even'});
};

module.exports = Errors;