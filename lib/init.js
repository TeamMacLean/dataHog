var thinky = require('./thinky.js');
var type = thinky.type;
var config = require('../config');
var Group = require('../models/group');
var async = require('async');
var fs = require('fs-extra');
var path = require('path');

//DROP ALL GROUPS
Group.run().then(function (allGroups) {

  async.each(allGroups, function (group, callback) {
    group.delete().then(function (result) {
      console.warn('dropped group:', result.name);
      callback();
    })
  }, function (err) { //callback after finish
    if (err) {
      throw err;
    }

    //ADD ALL THE GROUPS AGAIN
    async.each(config.groups, function (group, callback) {

      new Group({
        name: group
      }).save().then(function (savedModel) {
          console.log('added group:', savedModel.name);

          var joinedPath = path.join(config.dataDir, savedModel.safeName);

          fs.ensureDir(joinedPath, function (err) {
            if (err) {
              throw err;
            }
            callback();
          });


        }).error(function (err) {
          if (err) {
            throw err;
          }
        })
    }, function (err) {
      if (err) {
        throw err;
      }

      console.log('done!');
      process.exit();

    });
  });
});