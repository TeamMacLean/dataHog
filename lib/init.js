"use strict";

var thinky = require('./thinky.js');
//var type = thinky.type;
var config = require('../config.json');
var Group = require('../models/group');
var async = require('async');
var fs = require('fs-extra');
var path = require('path');
//var Promise = require('bluebird');

function ensureFolder(name, cb) {
  var joinedPath = path.join(config.dataDir, name);
  fs.ensureDir(joinedPath, function (err) {
    if (err) {
      cb(err);
    } else {
      cb();
    }
  });
}

function createGroup(name, cb) {

  new Group({
    name: name
  }).save().then(function (savedModel) {
    console.warn('added group:', savedModel.name);
    ensureFolder(savedModel.safeName, cb);
  }).error(function (err) {
    if (err) {
      cb(err);
    }
  });
}

module.exports = {

//ADD ALL THE GROUPS AGAIN
  reloadAllGroups: function (cb) {
    async.each(config.groups, function (group, callback) {

      Group.filter({name: group}).run().then(function (foundGroups) {
        if (foundGroups.length > 1) {
          callback(new Error('There are more than one groups called ' + group));
        } else if (foundGroups.length < 1) {
          createGroup(group, callback);
        } else {
          //there is 1 and thats ok with me :D
          ensureFolder(foundGroups[0].safeName, callback);
        }
      });
    }, function (err) {
      if (cb) {
        cb(err);
      }
    });
  },

  ensureBaseFolders: function (cb) {
    var baseFolders = ['reads', 'uploads'];
    async.each(baseFolders, function (folder, callback) {
      var fullPath = path.join(__dirname, '../', folder);
      fs.ensureDir(fullPath, function (err) {
        callback(err);
      });
    }, function (err) {
      if (cb) {
        cb(err);
      }
    });
  },

  checkForBadFolders: function (cb) {

    var allFoundGroupSafeNames = [];

    Group.run().then(function (groups) {
      async.each(groups, function (group, callback) {

        allFoundGroupSafeNames.push(group.safeName);
        callback();

      }, function () {
        fs.readdir(config.dataDir, function (err, folders) {
          if (err) {
            throw err;
          } else {
            async.each(folders, function (folder, callback) {
              if (allFoundGroupSafeNames.indexOf(folder) > -1) {
                console.log('good');
                //its good
              } else {
                console.warn('bad');
                //it should not be there
                console.log('need to delete', folder);
              }
              callback();
            }, function (err) {
              if (cb) {
                cb(err);
              }
            });
          }
        });
      });
    });
  },
  ensureReadyDB: function (cb) {
    var promises = [];
    for (var name in thinky.models) {
      if (thinky.models.hasOwnProperty(name)) {
        promises.push(thinky.models[name].ready());
      }
    }
    Promise.all(promises).then(function () {
      cb();
    });
  }
};



