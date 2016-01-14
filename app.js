var express = require('express');
var path = require('path');
var multer = require('multer');
var bodyParser = require('body-parser');
var routes = require('./routes');
var config = require('./config.json');
var fs = require('fs');
//var init = require('./lib/init');
var session = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var util = require('./lib/util');
var crons = require('./lib/cron');

var rethinkSession = require('session-rethinkdb')(session);


if (!config.appName || !config.port || !config.dataDir || !config.tmpDir) {
  console.error('please fill out config.json');
  process.exit(1);
}

//init.reloadAllGroups();
//init.ensureBaseFolders();
//init.checkForBadFolders();

if (!fs.existsSync(config.dataDir)) {
  console.error('dataDir', config.dataDir, 'does not exist');
}


if (!fs.existsSync(config.tmpDir)) {
  console.error('tmpDir', config.tmpDir, 'does not exist');
}

var app = express();
app.locals.title = config.appName;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(multer({
  dest: config.tmpDir
}));
app.use(express.static(path.join(__dirname, 'public')));

var options = {
  servers: [
    {host: 'localhost', port: 28015}
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


//kick off all existing schedules jobs
crons.loadFromDB();


module.exports = app;


