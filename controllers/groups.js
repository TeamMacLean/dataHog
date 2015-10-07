var Project = require('../models/project.js');

var Groups = {};

Groups.groups = [
  'Jonathan Jones Group',
  'Sophien Kamoun Group',
  'Ksenia Krasileva Group',
  'Matthew Moscou Group',
  'Silke Robatzek Group',
  'Cyril Zipfel Group',
  'The 2Blades Group',
  'Bioinformatics',
  'Proteomics',
  'Synthetic Biology',
  'Tissue Culture & Transformation'
].sort();

Groups.index = function (req, res, next) {
  res.render('groups/index', {groups: Groups.groups});
};

Groups.show = function (req, res) {
  var requestedGroup = req.params.group;

  if (requestedGroup === 'all') {
    Project.run().then(function (projects) {
      res.render('groups/show', {group: requestedGroup, projects: projects});
    });
  }

  Project.filter({group: requestedGroup}).run().then(function (projects) {
    res.render('groups/show', {group: requestedGroup, projects: projects});
  });
};

module.exports = Groups;