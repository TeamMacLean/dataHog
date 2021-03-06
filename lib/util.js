"use strict";

var Util = {};
var fs = require('fs-extra');
var path = require('path');
var async = require('async');

var config = require('../config.json');

var AdditionalFile = require('../models/additionalFile');
var passport = require('passport');
var LdapStrategy = require('passport-ldapauth');

var crypto = require('crypto');


Util.toSafeName = function (unsafeName) {
  return unsafeName.replace('&', 'and').replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

Util.generateSafeName = function (name, list, cb) { //$path, $filename
  var safeName = Util.toSafeName(name);
  var canHave = false;
  var testName = safeName;
  var testCount = 1;

  var filter = function (res) {
    return res.safeName === testName;
  };

  while (!canHave) {

    var dupes = list.filter(filter);

    if (dupes.length) {
      testCount += 1;
      testName = safeName + '_' + testCount;
    } else {
      canHave = true;
      cb(testName);
    }
  }
};

/**
 * get a safe name using the safename.... confusing
 * @param name
 * @param list
 * @param cb
 */
Util.generateUniqueName = function (name, list, cb) {

  var canHave = false;
  var testName = name;
  var testCount = 1;

  var filter = function (res) {
    return res.name === testName;
  };

  while (!canHave) {

    var dupes = list.filter(filter);
    if (dupes.length) {
      testCount += 1;
      testName = name + ' ' + testCount;
    } else {
      canHave = true;
      cb(testName);
    }
  }
};

/**
 *
 * @param fileName {string}
 * @param array [string]
 * @returns {*}
 */
Util.getUniqueFileName = function (fileName, array) {

  if (array.indexOf(fileName) > -1) {
    var i = 1;
    var out = fileName;
    while (array.indexOf(out) > -1) {
      i++;

      var base = fileName.split('.')[0];
      var ext = fileName.substring(fileName.indexOf('.'));
      out = base + i + ext;
    }
    return out;
  } else {
    //its already fine
    return fileName;
  }

};

Util.unknownFolders = function (folder, knownFolders, cb) {
  fs.readdir(folder, function (err, files) {

    var unknownFolders = [];

    if (err) {
      console.error(err);
    }

    if (files.length && files.length > 0) {
      files.map(function (file) {
        var fullPath = path.join(folder, file);
        var stat = fs.lstatSync(fullPath);
        //skip files
        if (stat.isDirectory()) {

          var matches = knownFolders.filter(function (e) {
            return e.safeName === file;
          });

          if (matches.length < 1) {
            unknownFolders.push(file);
          }
        }
      });
    }


    return cb(unknownFolders);
  });
};

/**
 *
 * @param model
 * @param additionalFiles array of strings
 * @param pathToParentDir
 * @param cb
 */
Util.addAdditional = function (model, additionalFiles, pathToParentDir, cb) {

  var joinedPathWithAddition = path.join(pathToParentDir, 'additional');


  fs.ensureDir(joinedPathWithAddition, function (err) {
    if (err) {
      return cb(err);
    } else {

      async.eachSeries(additionalFiles, function iterator(f, callback) {

          var fileName = f.name;
          var newPath = path.join(joinedPathWithAddition, fileName);
          console.log('about to move additional file', f); //FIXME
          Util.safeMove(f.path, newPath, function (err, movedPath) {

            if (err) {
              console.error('ERROR!!!!', err);
              callback(err);
            } else {

              console.log('moved additional file'); //FIXME

              console.log('MODAL', model.path);//FIXME

              var additionalFile = new AdditionalFile({
                parentID: model.id,
                name: path.basename(movedPath),
                path: path.join(model.path, 'additional', path.basename(movedPath)) //TODO this used to just be 'movedPath' which included the config.dataDir
              });

              console.log('about to save additional file'); //FIXME

              additionalFile.save().then(function () {

                console.log('saved additional file'); //FIXME
                callback();
              }).error(function (err) {
                callback(err);
              });
            }
          });
        }, function done(err) { //AFTER
          if (err) {
            console.error('ERROR!', err);
          }
          if (cb) {
            cb(err);
          }
        }
      );
    }
  });
};

Util.safeMove = function (from, to, cb) {

  var existingFiles = [];

  var toFileName = path.basename(to);

  var parentTo = path.join(to, '../');

  var files = fs.readdirSync(parentTo);

  //has to all be sync
  files.map(function (file) {
    var fullPathOfFile = path.join(parentTo, file);
    var stat = fs.statSync(fullPathOfFile);
    if (stat.isFile()) {
      existingFiles.push(file);
    }
  });

  var newFileName = Util.getUniqueFileName(toFileName, existingFiles);
  var newTo = path.join(parentTo, newFileName);

  //then
  //fs.rename(from, newTo);
  fs.move(from, newTo, function (err) {
    cb(err, newTo);
  });
};

Util.md5Stream = function (path, cb) {

  //cb('unknown');

  var fd = fs.createReadStream(path);
  var hash = crypto.createHash('md5');
  hash.setEncoding('hex');

  fd.on('end', function () {
    hash.end();
    cb(hash.read());
  });

  fd.pipe(hash);
};


Util.setupPassport = function () {

  passport.serializeUser(function (user, done) {
    //console.log('serializeUser was called');
    done(null, user);
  });

  passport.deserializeUser(function (obj, done) {
    //console.log('deserializeUser was called');
    done(null, obj);
  });

  passport.use(new LdapStrategy({
    server: {
      url: config.ldap.url,
      bindDn: config.ldap.bindDn,
      bindCredentials: config.ldap.bindCredentials,
      searchBase: config.ldap.searchBase,
      searchFilter: config.ldap.searchFilter
    }
  }, function (userLdap, done) {

    //if(userLdap.company === 'TSL'){ //TODO check company is TSL
    //}

    var user = {
      id: userLdap.sAMAccountName,
      username: userLdap.sAMAccountName,
      name: userLdap.name,
      mail: userLdap.mail,
      memberOf: userLdap.memberOf
    };

    done(null, user);
  }));
};


module.exports = Util;