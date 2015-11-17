"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var config = require('../config.json');

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
  var fs = require('fs');
  var MD5 = require('md5');

  var file = this;
  var unsafeName = file.name;
  if (!file.safeName) {
    AdditionalFile.run().then(function (result) {

      helper.generateSafeName(unsafeName, result, function (name) {
        file.safeName = name;

        fs.readFile(file.path, function (err, buf) {
          file.MD5 = MD5(buf);
          next();
        });
      });
    });
  }
});

module.exports = AdditionalFile;