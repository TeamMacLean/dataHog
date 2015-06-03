var express = require('express');
var router = express.Router();
var thinky = require('thinky')({db: 'Hog'});
var type = thinky.type;
var r = thinky.r;
var fs = require('fs');
var path = require('path');

var config = require('./config.json');

var Project = thinky.createModel('Project', {
  id: type.string(),
  name: type.string(),
  safeName: type.string(),
  responsiblePerson: type.string(),
  lab: type.string(),
  createdAt: type.date().default(r.now()),
  description: type.string()
});
Project.pre('save', function (next) {
  var project = this;
  var unsafeName = project.name;
  Project.run().then(function (result) {
    generateSafeName(unsafeName, result, function (name) {
      project.safeName = name;
      next();
    });
  });
});


var Run = thinky.createModel('Run', {
  id: type.string(),
  name: type.string(),
  safeName: type.string(),
  projectID: type.string(),
  createdAt: type.date().default(r.now()),
  sequencingProvider: type.string(),
  sequencingTechnology: type.string(),
  communicationExcerpts: type.string(),//TODO string or file
  sequencingProviderDatasheets: type.string(), //TODO files
  libraryInformation: type.string(), //text area
  libraryType: type.string(),//paired, mate, unpaired
  submissionToPublicPortal: type.string(),
  galaxyDataWanted: type.boolean()
});
Run.pre('save', function (next) {
  var run = this;
  var unsafeName = run.name;
  Run.run().then(function (result) {
    generateSafeName(unsafeName, result, function (name) {
      run.safeName = name;
      next();
    });
  });
});


var Read = thinky.createModel('Read', {
  id: type.string(),
  name: type.string(),
  safeName: type.string(),
  runID: type.string(),
  createdAt: type.date().default(r.now()),
  //filePath: type.string(),//upload one (unpaired) or two (paired, mate) files
  insertSize: type.number(),// (IF PARED OR MATE)
  organisms: type.string(),// sequenced - as specific as possible
  conditions: type.string(),
  moreInfo: type.string()// (text box)
});
Read.pre('save', function (next) {
  var read = this;
  var unsafeName = read.name;
  Read.run().then(function (result) {
    generateSafeName(unsafeName, result, function (name) {
      read.safeName = name;
      next();
    });
  });
});

Project.hasMany(Run, 'runs', 'id', 'projectID');
Run.hasMany(Read, 'reads', 'id', 'runID');
Run.belongsTo(Project, 'project', 'projectID', 'id');
Read.belongsTo(Run, 'run', 'runID', 'id');


//get index
router.get('/', function (req, res) {
  Project.then(function (projects) {
    return res.render('projects/index', {projects: projects});
  });
});


//404 page
router.get('/404', function (req, res) {
  res.render('error', {error: 'I can\'t even'});
});

//show by lab name
router.get('/lab/:lab', function (req, res) {

  var requestedLab = req.params.lab;

  Project.filter({lab: requestedLab}).run().then(function (projects) {

    res.render('lab/show', {lab: requestedLab, projects: projects});

  });

});

//get new project
router.get('/new', function (req, res) {
  return res.render('projects/new');
});

//post new project
router.post('/new', function (req, res) {

  var name = req.body.name;
  var lab = req.body.lab;
  var responsiblePerson = req.body.responsiblePerson;
  var description = req.body.description;


  var project = new Project({
    name: name,
    lab: lab,
    responsiblePerson: responsiblePerson,
    description: description
  });

  project.save().then(function (result) {

    //TODO createFolder
    createFolder(result.safeName, function (err) {
      if (err) {
        return res.render('error');
      }
      return res.redirect('/' + project.id);
    });

  });

});


//get project
router.get('/:project', function (req, res) {
  var projectID = req.params.project;

  Project.get(projectID).getJoin({runs: true}).run().then(function (project) {
    return res.render('projects/show', {project: project});
  }).error(function () {
    return res.render('error', {error: 'could not find project'});
  });
});

//get new run
router.get('/:project/new', function (req, res) {
  var projectID = req.params.project;
  Project.get(projectID).getJoin({runs: true}).run().then(function (project) {
    return res.render('runs/new', {project: project});
  }).error(function () {
    return res.render('error', {error: 'could not create project'});
  });
});

//post new run
router.post('/:project/new', function (req, res) {
  var projectID = req.params.project;
  var name = req.body.name;

  var sequencingProvider = req.body.sequencingProvider;
  var sequencingTechnology = req.body.sequencingTechnology;
  var communicationExcerpts = req.body.communicationExcerpts;
  var sequencingProviderDatasheets = req.body.sequencingProviderDatasheets;
  var libraryInformation = req.body.libraryInformation;
  var libraryType = req.body.libraryType;
  var submissionToPublicPortal = req.body.submissionToPublicPortal;
  var galaxyDataWanted = req.body.galaxyDataWanted === 'on';

  var run = new Run({
    name: name,
    projectID: projectID,
    sequencingProvider: sequencingProvider,
    sequencingTechnology: sequencingTechnology,
    communicationExcerpts: communicationExcerpts,
    sequencingProviderDatasheets: sequencingProviderDatasheets,
    libraryInformation: libraryInformation,
    libraryType: libraryType,
    submissionToPublicPortal: submissionToPublicPortal,
    galaxyDataWanted: galaxyDataWanted
  });
  run.save().then(function (result) {
    return res.redirect('/' + projectID + '/' + run.id);
  });
});

//get run
router.get('/:project/:run', function (req, res) {
  var runID = req.params.run;

  Run.get(runID).getJoin({project: true, reads: true}).then(function (run) {
    return res.render('runs/show', {run: run});
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  })
});

//get new read
router.get('/:project/:run/new', function (req, res) {
  var runID = req.params.run;

  Run.get(runID).getJoin({project: true}).run().then(function (run) {
    return res.render('readData/new', {run: run});
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  })

});

//post new read
router.post('/:project/:run/new', function (req, res) {
  var name = req.body.name;
  var runID = req.params.run;
  var projectID = req.params.project;
  //var filePath = req.body.filePath;
  var insertSize = req.body.insertSize;
  var organisms = req.body.organisms;
  var conditions = req.body.conditions;
  var moreInfo = req.body.moreInfo;


  var read = new Read({
    name: name,
    runID: runID,
    //filePath: filePath,
    insertSize: insertSize,
    organisms: organisms,
    conditions: conditions,
    moreInfo: moreInfo
  });

  read.save().then(function (result) {
    return res.redirect('/' + projectID + '/' + runID + '/' + read.id);
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  })

});

//get read
router.get('/:project/:run/:read', function (req, res) {

  var readID = req.params.read;
  Read.get(readID).getJoin({run: true}).run().then(function (read) {
    return res.render('readData/show', {read: read});
  });
});


function generateSafeName(name, list, cb) { //$path, $filename
  var safeName = toSafeName(name, this.name);
  var canHave = false;
  var testName = safeName;
  var testCount = 0;


  while (!canHave) {

    var dupes = list.filter(function (res) {
      //console.log(res);
      return res.safeName === testName;
    });

    if (dupes.length) {
      testCount += 1;
      testName = safeName + '_' + testCount
    } else {
      canHave = true;
      cb(testName);
    }
  }
}

function safeMakeDir(fullPath, cb) {
  try {
    fs.mkdirSync(fullPath);
    return cb();
  } catch (e) {
    if (e.code != 'EEXIST') {
      return cb(e);
    }
  }
}


function createFolder(folderPath, cb) {

  var root = config.dataDir;
  var rootExists = fs.existsSync(root);


  if (!rootExists) {
    safeMakeDir(root, makeFullPath);
  } else {
    makeFullPath();
  }

  function makeFullPath(err) {

    if (err) {
      return cb(err);
    } else {
      var fullPath = path.join(root, folderPath);
      safeMakeDir(fullPath, function (err) {
        if (err) {
          return cb(err);
        } else {
          return cb();
        }
      });
    }
  }
}

function toSafeName(unsafeName) {
  return unsafeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

module.exports = router;
