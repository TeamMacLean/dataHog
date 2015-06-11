var express = require('express');
var router = express.Router();


var Projects = require(__dirname + '/controllers/projects.js');
var Runs = require(__dirname + '/controllers/projects.js');
//var Reads = require(__dirname + '/controllers/projects.js');
var Errors = require(__dirname + '/controllers/errors.js');

//get index
router.get('/', Projects.index);

//404 page
router.get('/404', Errors.show);

//show by lab name
router.get('/lab/:lab', Projects.lab);

//get new project
router.get('/new', Projects.new);

//post new project
router.post('/new', Projects.newPost);

//get project
router.get('/:project', Projects.show);

//get new run
router.get('/:project/new', Runs.new);

//post new run
router.post('/:project/new', Runs.newPost);


//get run
router.get('/:project/:run', Runs.show);

//router.get('/:project/:run/fastqc', Runs.fastQC);


module.exports = router;
