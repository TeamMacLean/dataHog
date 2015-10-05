var express = require('express');
var router = express.Router();

var Groups = require(__dirname + '/controllers/groups.js');
var Projects = require(__dirname + '/controllers/projects.js');
var Runs = require(__dirname + '/controllers/runs.js');
var Samples = require(__dirname + '/controllers/samples.js');
var Reads = require(__dirname + '/controllers/reads.js');
var Errors = require(__dirname + '/controllers/errors.js');

//get index
router.get('/', Groups.index);

//show by lab name
router.get('/groups/:group', Groups.show);

//get new project
router.get('/new', Projects.new);

//post new project
router.post('/new', Projects.newPost);

//get project
router.get('/:project', Projects.show);

//get new sample
router.get('/:project/new', Samples.new);

//post new sample
router.post('/:project/new', Samples.newPost);

//get sample
router.get('/:project/:sample', Samples.show);

//get new run
router.get('/:project/:sample/new', Runs.new);

//post new run
router.post('/:project/:sample/new', Runs.newPost);

//show run
router.get('/:project/:sample/:run', Runs.show);//TODO

//show read
router.get('/:project/:sample/:run/:read', Reads.show);//TODO

//show run qc
router.get('/:project/:sample/:run/:read/fastqc', Reads.fastQC);//TODO

//404 page
router.get(['/404', '/:404'], Errors.show);

module.exports = router;
