var path = require('path');
var multer = require('multer');
var bodyParser = require('body-parser');
var routes = require('./routes');
var config = require('./config.json');
var fs = require('fs');
var session = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var util = require('./lib/util');
var socketUploader = require('./lib/socketUploader');
var rethinkSession = require('session-rethinkdb')(session);
var Submission = require('./models/submission');
var schedule = require('node-schedule');
var moment = require('moment');
var email = require('./lib/email');


if (!config.appName || !config.port || !config.dataDir || !config.tmpDir) {
  console.error('please fill out config.json');
  process.exit(1);
}


if (!fs.existsSync(config.dataDir)) {
  console.error('dataDir', config.dataDir, 'does not exist');
}


if (!fs.existsSync(config.tmpDir)) {
  console.error('tmpDir', config.tmpDir, 'does not exist');
}

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.locals.title = config.appName;
app.use(express.static(__dirname + '/public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(multer({
  dest: config.tmpDir
}));


var options = {
  servers: [
    {host: 'localhost', port: 28015, db: 'Hog'}
  ]
};

var store = new rethinkSession(options);

app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  if (req.user != null) {
    res.locals.signedInUser = {};
    res.locals.signedInUser.username = req.user.username;
    res.locals.signedInUser.name = req.user.name;
    res.locals.signedInUser.mail = req.user.mail;
  }
  next(null, req, res);
});

util.setupPassport();


app.use(routes);

app.use(function (err, req, res, next) {
  if (err) {
    console.error(err);
    return res.status(500).render('error', {error: err});
  } else {
    return next();
  }
});


Submission.getJoin({
  run: {
    sample: {
      project: true
    }
  }
}).run().then(function (subs) {
  subs.map(function (s) {
    var now = moment();
    var holdTill = moment(s.holdDate);
    var diffInDays = holdTill.diff(now, 'days');
    console.log(diffInDays, 'days until', s.id, 'is public in ENA');
    var FourWeeks = holdTill.subtract(4, 'weeks');
    var ThreeWeeks = holdTill.subtract(3, 'weeks');
    var TwoWeeks = holdTill.subtract(2, 'weeks');
    var OneWeek = holdTill.subtract(1, 'weeks');
    var TwoDays = holdTill.subtract(2, 'days');
    var OneDay = holdTill.subtract(1, 'days');

    var contacts = [s.run.sample.project.responsiblePerson, s.run.sample.project.secondaryContact];

    schedule.scheduleJob(FourWeeks, function () {
      email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 4 weeks, the data being published can be found at ' + s.run.path, contacts)
    });
    schedule.scheduleJob(ThreeWeeks, function () {
      email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 3 weeks, the data being published can be found at ' + s.run.path, contacts)
    });
    schedule.scheduleJob(TwoWeeks, function () {
      email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 2 weeks, the data being published can be found at ' + s.run.path, contacts)
    });
    schedule.scheduleJob(OneWeek, function () {
      email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 1 weeks, the data being published can be found at ' + s.run.path, contacts)
    });
    schedule.scheduleJob(TwoDays, function () {
      email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 2 days, the data being published can be found at ' + s.run.path, contacts)
    });
    schedule.scheduleJob(OneDay, function () {
      email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA TOMORROW, the data being published can be found at ' + s.run.path, contacts)
    });
  })
});


socketUploader(io);


module.exports = server;


