"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var r = thinky.r;
var util = require('../lib/util');
var config = require('../config.json');
var js2xmlparser = require('js2xmlparser');

var Project = thinky.createModel('Project', {
  id: type.string(),
  name: type.string().required(),
  responsiblePerson: type.string().required(),
  groupID: type.string().required(),
  shortDescription: type.string().required(),
  longDescription: type.string().required(),
  secondaryContact: type.string().required(),
  createdAt: type.date().default(r.now()),
  path: type.string().required(),
  safeName: type.string().required()
});

Project.pre('save', function (next) {
  var project = this;
  var unsafeName = project.name;
  if (!project.safeName) {
    Project.filter({groupID: project.groupID}).run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (newSafeName) {
        project.safeName = newSafeName;
        util.generateUniqueName(project.name, result, function (newName) {
          project.name = newName;
          Group.get(project.groupID).run().then(function (group) {
            project.path = group.path + '/' + project.safeName;
            next();
          });
        });
      });
    });
  }
});

Project.define("hpcPath", function () {
  if (config.hpcRoot) {
    return config.hpcRoot + this.path;
  } else {
    return this.path;
  }
});

Project.define('submit', function (cb) {
  console.log('submitting');

  cb(null, null);
});

Project.define("toENA", function () {
  var studyObj = {
    "STUDY": {
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
      "DESCRIPTOR": {
        "STUDY_TITLE": this.name,
        "STUDY_ABSTRACT": this.shortDescription,
        "STUDY_DESCRIPTION": this.longDescription,
        "CENTER_PROJECT_NAME": this.name,
        "STUDY_TYPE": {
          "@": {
            "existing_study_type": "Other"
          }
        }
      }
    }
  };
  return js2xmlparser("STUDY_SET", studyObj);
});

module.exports = Project;

var Sample = require('./sample.js');
var Group = require('./group');
var AdditionalFile = require('./additionalFile');
Project.belongsTo(Group, 'group', 'groupID', 'id');
Project.hasMany(Sample, 'samples', 'id', 'projectID');
Project.hasMany(AdditionalFile, 'additionalFiles', 'id', 'parentID');