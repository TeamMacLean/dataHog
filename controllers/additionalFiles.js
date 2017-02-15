"use strict";

const AdditionalFile = require('../models/additionalFile');
const path = require('path');
const AdditionalFiles = {};
const config = require('../config.json');


AdditionalFiles.download = function (req, res) {
    const fID = req.params.id;


    AdditionalFile.get(fID).run().then(function (file) {
        const insideReadPath = path.join(config.dataDir, file.path);
        const absPath = path.resolve(insideReadPath);
        return res.download(absPath, file.name);
    });

};

module.exports = AdditionalFiles;
