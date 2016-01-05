"use strict";

var AdditionalFile = require('../models/additionalFile');
var path = require('path');
var AdditionalFiles = {};
var config = require('../config.json');


AdditionalFiles.download = function (req, res) {
  var fID = req.params.id;


  AdditionalFile.get(fID).run().then(function (file) {
    var insideReadPath = path.join(config, file.path);
    var absPath = path.resolve(insideReadPath);
    return res.download(absPath, file.name);
  });

};

module.exports = AdditionalFiles;
