var express = require('express');
var router = express.Router();

var Group = require('./models/group');

var Groups = require(__dirname + '/controllers/groups.js');
var Projects = require(__dirname + '/controllers/projects.js');
var Runs = require(__dirname + '/controllers/runs.js');
var Samples = require(__dirname + '/controllers/samples.js');
var Reads = require(__dirname + '/controllers/reads.js');
var Errors = require(__dirname + '/controllers/errors.js');
var Auth = require(__dirname + '/controllers/auth.js');
var AdditionalFiles = require(__dirname + '/controllers/additionalFiles.js');

var config = require('./config.json');

//get index
router.route('/').get(Auth.index);

router.route('/signin')
  .get(Auth.signIn)
  .post(Auth.signInPost);

router.route('/signout')
  .get(Auth.signOut);

//router.route('/iamadmin').all([isAuthenticated, isAdmin], function (req, res, next) {
//  res.send('<html><body><img src="http://i.imgur.com/ZMvyKk2.gif"><h1>Your an admin Harry!</h1></body></html>');
//});

//download additional File
router.route('/additional/:id/download')
  .all(isAuthenticated)
  .get(AdditionalFiles.download);

router.route('/groups')
  .all(isAuthenticated)
  .get(Groups.index);

//show by lab name
router.route('/:group')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Groups.show);

//get new project
router.route('/:group/new')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Projects.new);

//post new project
router.route('/:group/new')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .post(Projects.newPost);

//get project
router.route('/:group/:project')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Projects.show);

//get new sample
router.route('/:group/:project/new')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Samples.new);

//post new sample
router.route('/:group/:project/new')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .post(Samples.newPost);

//get sample
router.route('/:group/:project/:sample')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Samples.show);

//get new run
router.route('/:group/:project/:sample/new')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Runs.new);

//post new run
router.route('/:group/:project/:sample/new')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .post(Runs.newPost);

//show run
router.route('/:group/:project/:sample/:run')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Runs.show);

//new read
router.post('/:group/:project/:sample/:run/add')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .post(Runs.addPost);

//show read
router.route('/:group/:project/:sample/:run/:read')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Reads.show);

//show run qc
router.route('/:group/:project/:sample/:run/:read/fastqc')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Reads.fastQC);

//download run file
router.route('/:group/:project/:sample/:run/:read/download')
  .all(isAuthenticated)
  .all(isPartOfGroup)
  .get(Reads.download);

//404 page
router.get('*', Errors.show);


function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.session.returnTo = req.path;
    return res.redirect('/signin');
  }
}

function isPartOfGroup(req, res, next) {

  if (_isAdmin(req)) {
    return next();
  }

  if (!req.user) {
    return next('not signed in');
  }
  var currentUserGroups = req.user.memberOf;
  var reqGroup = req.params.group;

  if (!reqGroup) {
    return next('not found');
  }


  //currentUserGroup is an array of all groups the user is a member of

  var match = config.groups.filter(function (g) {

    var groupsGroupName = g.memberOf;

    currentUserGroups.map(function (cug) {

      console.log(groupsGroupName, 'in', cug, cug.indexOf(groupsGroupName) > -1);

      if (cug.indexOf(groupsGroupName) > -1) {
        return true;
      }
    });

    //currentUserGroup.map(function (gg) {
    //  console.log(g, 'in', gg);
    //  if (gg.indexOf(g) > -1) {
    //    return true;
    //  }
    //});

    //console.log(g.memberOf, 'IS', g.memberOf.indexOf(currentUserGroup) > -1);
    //return g.memberOf.indexOf(currentUserGroup) > -1;
  });

  if (match.length > 1) {
    return next('error, too many groups found. sorry');
  }
  if (match.length < 1) {
    return next('you could not be found in the groups list');
  }

  Group.filter({name: match[0].name}).then(function (groups) {
    if (groups.length < 1) {
      return next('group name ' + match[0].name + ' not found, please check that the config matches the group names in the DB');
    } else {
      var group = groups[0];
      if (group.safeName == reqGroup) {
        return next();
      } else {
        return next('you do not have permission to view this group');
      }
    }
  });
}

function _isAdmin(req) {
  if (req.isAuthenticated()) {
    return config.admins.indexOf(req.user.username) > -1;
  } else {
    return false;
  }
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if (isAdmin(req)) {
      return next();
    } else {
      return res.render('error', {error: 'you must be an admin to preform that action'});
    }
  } else {
    //they are not signed in, cannot be an admin
    req.session.returnTo = req.path;
    return res.redirect('/signin');
  }
}

module.exports = router;
