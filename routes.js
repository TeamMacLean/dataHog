var express = require('express');
var router = express.Router();

var Groups = require(__dirname + '/controllers/groups.js');
var Projects = require(__dirname + '/controllers/projects.js');
var Runs = require(__dirname + '/controllers/runs.js');
var Samples = require(__dirname + '/controllers/samples.js');
var Reads = require(__dirname + '/controllers/reads.js');
var Errors = require(__dirname + '/controllers/errors.js');
var Index = require(__dirname + '/controllers/index.js');
//get index
router.get('/', Index.index);
router.get('/groups', Groups.index);

//show by lab name
router.get('/:group', Groups.show);

//get new project
router.get('/:group/new', Projects.new);

//post new project
router.post('/:group/new', Projects.newPost);

//get project
router.get('/:group/:project', Projects.show);

//get new sample
router.get('/:group/:project/new', Samples.new);

//post new sample
router.post('/:group/:project/new', Samples.newPost);

//get sample
router.get('/:group/:project/:sample', Samples.show);

//get new run
router.get('/:group/:project/:sample/new', Runs.new);

//post new run
router.post('/:group/:project/:sample/new', Runs.newPost);

//show run
router.get('/:group/:project/:sample/:run', Runs.show);

//new read
router.post('/:group/:project/:sample/add', Runs.addPost);

//show read
router.get('/:group/:project/:sample/:run/:read', Reads.show);

//show run qc
router.get('/:group/:project/:sample/:run/:read/fastqc', Reads.fastQC);

//404 page
router.get(['/404', '/:404'], Errors.show);

module.exports = router;
