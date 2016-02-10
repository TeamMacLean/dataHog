var fs = require('fs');
var path = require('path');
var config = require('../config.json');

var tmp = config.tmpDir;

var Upload = require('../models/upload');

module.exports = function (io) {

  io.sockets.on('connection', function (socket) {

    var Files = {};

    socket.on('reset', function (data) {
      console.log('resetting');
      Files = {}
    });

    socket.on('Start', function (data) { //data contains the variables that we passed through in the html file

      console.log('starting');

      var UUID = data['UUID'];

      var upload = new Upload({
        name: data.Name,
        uuid: UUID
      });

      upload.save().then(function () {
        var outPath = path.join(tmp, UUID);
        Files[UUID] = {  //Create a new Entry in The Files Variable
          FileSize: data['Size'],
          Data: "",
          Downloaded: 0,
          Path: outPath,
          Dir: data['Dir']
        };
        var Place = 0;
        //var outPath = path.join(tmp, Files[Name].Dir, Name);

        try {
          var Stat = fs.statSync(outPath);
          if (Stat.isFile()) {
            Files[UUID]['Downloaded'] = Stat.size;
            Place = Stat.size / 524288;
          }
        }
        catch (er) {
        } //It's a New File
        fs.open(outPath, "a", 775, function (err, fd) {
          if (err) {
            console.log(err);
          }
          else {
            Files[UUID]['Handler'] = fd; //We store the file handler so we can write to it later
            //console.log('more 0');
            socket.emit('MoreData', {'Place': Place, Percent: 0, UUID: UUID});
          }
        });
      }).error(function (err) {
        console.error(err);
      });
    });
    socket.on('Upload', function (data) {
      var UUID = data['UUID'];
      Files[UUID]['Downloaded'] += data['Data'].length;
      Files[UUID]['Data'] += data['Data'];
      if (Files[UUID]['Downloaded'] == Files[UUID]['FileSize']) //If File is Fully Uploaded
      {
        fs.write(Files[UUID]['Handler'], Files[UUID]['Data'], null, 'Binary', function (err, Writen) {
          if (err) {
            console.log('error!', err);
          }

          console.log('complete', Files[UUID]['Path']);
          socket.emit('Complete', {UUID: UUID, Path: Files[UUID]['Path']});
        });
      }
      else if (Files[UUID]['Data'].length > 10485760) { //If the Data Buffer reaches 10MB
        fs.write(Files[UUID]['Handler'], Files[UUID]['Data'], null, 'Binary', function (err, Writen) {
          if (err) {
            console.log('error!', err);
          }
          Files[UUID]['Data'] = ""; //Reset The Buffer
          var Place = Files[UUID]['Downloaded'] / 524288;
          var Percent = (Files[UUID]['Downloaded'] / Files[UUID]['FileSize']) * 100;
          //console.log('more 1')
          socket.emit('MoreData', {'Place': Place, 'Percent': Percent, UUID: UUID});
        });
      }
      else {
        var Place = Files[UUID]['Downloaded'] / 524288;
        var Percent = (Files[UUID]['Downloaded'] / Files[UUID]['FileSize']) * 100;
        //console.log('more 2')
        socket.emit('MoreData', {'Place': Place, 'Percent': Percent, UUID: UUID});
      }
    });
  });
  return io;
};
