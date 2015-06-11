var Errors = {};

Errors.show = function(req, res){
  res.render('error', {error: 'I can\'t even'});
};

module.exports = Errors;