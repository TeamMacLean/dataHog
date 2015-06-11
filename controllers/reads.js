var Reads = {};


////get new read
//router.get('/:project/:run/new', function (req, res) {
//  var runID = req.params.run;
//
//  Run.get(runID).getJoin({project: true}).run().then(function (run) {
//    return res.render('readData/new', {run: run});
//  }).error(function () {
//    return res.render('error', {error: 'could not find run'});
//  })
//
//});
//
////post new read
//router.post('/:project/:run/new', function (req, res) {
//  var name = req.body.name;
//  var runID = req.params.run;
//  var projectID = req.params.project;
//  //var filePath = req.body.filePath;
//  var insertSize = req.body.insertSize;
//  var organisms = req.body.organisms;
//  var conditions = req.body.conditions;
//  var moreInfo = req.body.moreInfo;
//
//
//  var read = new Read({
//    name: name,
//    runID: runID,
//    //filePath: filePath,
//    insertSize: insertSize,
//    organisms: organisms,
//    conditions: conditions,
//    moreInfo: moreInfo
//  });
//
//  read.save().then(function (result) {
//    return res.redirect('/' + projectID + '/' + runID + '/' + read.id);
//  }).error(function () {
//    return res.render('error', {error: 'could not find run'});
//  })
//
//});
//
////get read
//router.get('/:project/:run/:read', function (req, res) {
//
//  var readID = req.params.read;
//  Read.get(readID).getJoin({run: true}).run().then(function (read) {
//    return res.render('readData/show', {read: read});
//  });
//});

module.exports = Reads;