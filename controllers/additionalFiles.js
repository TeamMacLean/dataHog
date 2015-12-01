"use strict";

var AdditionalFile = require('../models/additionalFile');
var path = require('path');
var AdditionalFiles = {};


AdditionalFiles.download = function (req, res) {
  var fID = req.params.id;


  AdditionalFile.get(fID).run().then(function (file) {
    var absPath = path.resolve(file.path);
    return res.download(absPath, file.name);
  });

};

module.exports = AdditionalFiles;
