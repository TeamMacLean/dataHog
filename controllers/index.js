"use strict";

var Index = {};

/**
 * render site index
 * @param req {request}
 * @param res {response}
 */
Index.index = function (req, res) {
  res.render('index');
};

module.exports = Index;