var express = require('express');
var router = express.Router();
var thinky = require('thinky')({db: 'Hog'});
var type = thinky.type;
var r = thinky.r;

var Project = thinky.createModel('Project', {
  id: type.string(),
  name: type.string(),
  createdAt: type.date().default(r.now())
});


var Run = thinky.createModel('Run', {
  id: type.string(),
  name: type.string(),
  projectID: type.string(),
  createdAt: type.date().default(r.now())
});


var Read = thinky.createModel('Read', {
  id: type.string(),
  name: type.string(),
  runID: type.string(),
  createdAt: type.date().default(r.now())
});

Project.hasMany(Run, 'runs', 'id', 'projectID');
Run.hasMany(Read, 'reads', 'id', 'runID');
Run.belongsTo(Project, 'project', 'projectID', 'id');
Read.belongsTo(Run, 'run', 'runID', 'id');


//get index
router.get('/', function (req, res, next) {
  Project.then(function (projects) {
    return res.render('projects/index', {projects: projects});
  });
});

//get new project
router.get('/new', function (req, res, next) {
  return res.render('projects/new');
});

//post new project
router.post('/new', function (req, res, next) {

  var name = req.body.name;

  var project = new Project({
    name: name
  });

  project.save().then(function (result) {
    return res.redirect('/' + project.id);
  });

});

//get project
router.get('/:project', function (req, res, next) {
  var projectID = req.params.project;

  Project.get(projectID).getJoin({runs: true}).run().then(function (project) {
    return res.render('projects/show', {project: project});

  }).error(function () {
    return next();
  });
});

//get new run
router.get('/:project/new', function (req, res, next) {
  var projectID = req.params.project;
  Project.get(projectID).getJoin({runs: true}).run().then(function (project) {
    return res.render('runs/new', {project: project});
  }).error(next);

});

//post new run
router.post('/:project/new', function (req, res, next) {
  var projectID = req.params.project;
  var name = req.body.name;

  var run = new Run({
    name: name,
    projectID: projectID
  });
  run.save().then(function (result) {
    return res.redirect('/' + projectID + '/' + run.id);
  });
});

//get run
router.get('/:project/:run', function (req, res, next) {
  var runID = req.params.run;

  Run.get(runID).getJoin({project: true, reads: true}).then(function (run) {
    return res.render('runs/show', {run: run});
  }).error(next);
});

//get new read
router.get('/:project/:run/new', function (req, res, next) {
  var runID = req.params.run;

  Run.get(runID).getJoin({project: true}).run().then(function (run) {
    return res.render('reads/new', {run: run});
  }).error(next);

});

//post new read
router.post('/:project/:run/new', function (req, res, next) {
  var name = req.body.name;
  var runID = req.params.run;
  var projectID = req.params.project;

  console.log('body', req.body);
  console.log('files', req.files);

  var read = new Read({
    name: name,
    runID: runID
  });

  read.save().then(function (result) {
    return res.redirect('/' + projectID + '/' + runID + '/' + read.id);
  }).error(next);

});

//get read
router.get('/:project/:run/:read', function (req, res, next) {

  var readID = req.params.read;
  Read.get(readID).getJoin({run: true}).run().then(function (read) {
    return res.render('reads/show', {read: read});
  });
});

module.exports = router;
