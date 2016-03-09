var util = require('./lib/util');

var project = {};
var result = [];
project.unsafeName = "Sequencing field isolates of Phakopsora";

util.generateSafeName(project.unsafeName, result, function (newSafeName) {
  project.safeName = newSafeName;
  util.generateUniqueName(project.name, result, function (newName) {
    project.name = newName;
    console.log(project);
    process.exit();
  });
});