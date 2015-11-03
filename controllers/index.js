var Index = {};

/**
 * render site index
 * @param req {request}
 * @param res {response}
 * @param next {callback}
 */
Index.index = function (req, res, next) {
  res.render('index');
};

module.exports = Index;