var express = require('express');
var path = require('path');
var logger = require('morgan');
var multer = require('multer');
var bodyParser = require('body-parser');
var routes = require('./routes');
var config = require('./config');

var app = express();
app.locals.title = config.appName;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({
  dest: config.tmpDir,
  rename: function (fieldname, filename) {
    return filename + Date.now();
  },
  onFileUploadStart: function (file) {
    console.log(file.originalname + ' is starting ...');
  },
  onFileUploadComplete: function (file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path);
    done = true;
  }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);
app.listen(config.port, '0.0.0.0', function () {
  console.log('Listening on port 3000...');
});
