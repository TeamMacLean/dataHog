"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var config = require('../config.json');

var util = require('../lib/util');

var AdditionalFile = thinky.createModel('AdditionalFile', {
  id: type.string(),
  parentID: type.string(),
  name: type.string().required(),
  MD5: type.string(),
  safeName: type.string(),
  path: type.string().required()
});

AdditionalFile.define("hpcPath", function () {
  if (config.hpcRoot) {
    return config.hpcRoot + this.path;
  } else {
    return this.path;
  }
});

AdditionalFile.pre('save', function (next) {

  var helper = require('../lib/util.js');

  var file = this;
  var unsafeName = file.name;
  if (!file.safeName) {
    AdditionalFile.filter({parentID: file.parentID}).run().then(function (result) {

      helper.generateSafeName(unsafeName, result, function (name) {
        file.safeName = name;

        if (!file.MD5) {

          helper.md5Stream(file.path, function (md5) {
            file.MD5 = md5;
            next();
          });
        }
      });
    });
  }
});


module.exports = AdditionalFile;