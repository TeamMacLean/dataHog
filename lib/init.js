var thinky = require('./thinky.js');
var type = thinky.type;
var config = require('../config');
var Group = require('../models/group');
var async = require('async');

module.exports = {
  reloadAllGroups: function () {

    //DROP ALL GROUPS
    Group.run().then(function (allGroups) {

      async.each(allGroups, function (group, callback) {
          group.delete().then(function (result) {
            console.warn('dropped group:', result.name);
            callback();
          })
        }
        , function (err) { //callback after finish
          if (err) {
            throw err;
          }

          //ADD ALL THE GROUPS AGAIN
          config.groups.map(function (group) {
            new Group({
              name: group
            }).save().then(function (savedModel) {
                console.log('added group:', savedModel.name);
              }).error(function (err) {
                console.error(err);
              })
          });

        });
    });
  }
};