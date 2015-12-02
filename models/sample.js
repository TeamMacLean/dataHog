"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var util = require('../lib/util');
var js2xmlparser = require('js2xmlparser');
var config = require('../config.json');

var Sample = thinky.createModel('Sample', {
  id: type.string(),
  projectID: type.string().required(),
  name: type.string().required(),
  organism: type.string().required(),
  ncbi: type.string().required(),
  conditions: type.string().required(),
  sampleGroup: type.string().required(),
  path: type.string().required(),
  safeName: type.string().required()
});

Sample.pre('save', function (next) {
  var sample = this;
  var unsafeName = sample.name;
  if (!sample.safeName) {
    Sample.filter({projectID: sample.projectID}).run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (name) {
        sample.safeName = name;
        //now create sampleGroup
        Project.get(sample.projectID).run().then(function (project) {
          sample.path = project.path + '/' + sample.safeName;
          sample.sampleGroup = project.safeName + '_' + name;
          util.generateUniqueName(sample.name, result, function (newName) {
            sample.name = newName;
            next();
          });
        });
      });
    });
  }
});

Sample.define("hpcPath", function () {
  if (config.hpcRoot) {
    return config.hpcRoot + this.path;
  } else {
    return this.path;
  }
});

Sample.define("toENA", function () {
  var sampleObj = {
    "SAMPLE": {
      "@": {
        "alias": this.safeName,
        "center_name": config.ena.namespace
      },
      "IDENTIFIERS": {
        "SUBMITTER_ID": {
          "@": {
            "namespace": config.ena.namespace
          },
          "#": this.safeName
        }
      },
      "SAMPLE_NAME": {
        "TAXON_ID": this.ncbi,
        "COMMON_NAME": this.organism,
        "SCIENTIFIC_NAME": this.organism
      }
    }
  };
  return js2xmlparser("SAMPLE_SET", sampleObj);
});

module.exports = Sample;

var Run = require('./run');
var Project = require('./project');
Sample.belongsTo(Project, 'project', 'projectID', 'id');
Sample.hasMany(Run, 'runs', 'id', 'sampleID');

var AdditionalFile = require('./additionalFile');
Sample.hasMany(AdditionalFile, 'additionalFiles', 'id', 'parentID');