var fs = require('fs');
var path = require('path');
var config = require('../config.json');

var tmp = config.tmpDir;

var Upload = require('../models/upload');

var CHUNK_SIZE = 1024 * 100; //100kb


module.exports = function (io) {

    io.sockets.on('connection', function (socket) {
        var Files = {};
        socket.on('reset', function (data) {
            console.log('resetting');
            Files = {}
        });

        socket.on('Start', function (data) { //data contains the variables that we passed through in the html file

            console.log('starting upload');

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
                        Place = Stat.size / CHUNK_SIZE;
                    }
                }
                catch (er) {
                } //It's a New File
                fs.open(outPath, "a", 775, function (err, fd) { //TODO here is a good place to kill stuff
                    if (err) {
                        console.log(err);
                        fs.closeSync(fd)
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

            if (!Files[UUID]['Data'] || Files[UUID]['Data'].length < 1) {
                console.log('I think the upload failed, there was not data (or less than one byte)');
            }

            if (Files[UUID]['Downloaded'] == Files[UUID]['FileSize']) //If File is Fully Uploaded
            {
                fs.write(Files[UUID]['Handler'], Files[UUID]['Data'], null, 'Binary', function (err, Writen) {
                    if (err) {
                        console.log('error!', err);
                        stopAndDelete(UUID);
                    }

                    console.log('upload complete', Files[UUID]['Path']);
                    stopAndDelete(UUID);
                    socket.emit('Complete', {UUID: UUID, Path: Files[UUID]['Path']});
                });
            }
            else if (Files[UUID]['Data'].length > 10485760) { //If the Data Buffer reaches 10MB
                fs.write(Files[UUID]['Handler'], Files[UUID]['Data'], null, 'Binary', function (err, Writen) {
                    if (err) {
                        console.log('error!', err);
                        stopAndDelete(UUID);
                    }
                    Files[UUID]['Data'] = ""; //Reset The Buffer
                    var Place = Files[UUID]['Downloaded'] / CHUNK_SIZE;
                    var Percent = (Files[UUID]['Downloaded'] / Files[UUID]['FileSize']) * 100;
                    //console.log('more 1')
                    socket.emit('MoreData', {'Place': Place, 'Percent': Percent, UUID: UUID});
                });
            }
            else {
                var Place = Files[UUID]['Downloaded'] / CHUNK_SIZE;
                var Percent = (Files[UUID]['Downloaded'] / Files[UUID]['FileSize']) * 100;
                //console.log('more 2')
                socket.emit('MoreData', {'Place': Place, 'Percent': Percent, UUID: UUID});
            }
        });
        socket.on('Stop', function (UUID) {
            console.log('stop called');
            stopAndDelete(UUID);
        });

        function stopAndDelete(UUID) {

            var file = Files[UUID];

            if (file) {
                fs.closeSync(file['Handler']); //STOP THE FD
                delete Files[UUID];  //TODO SHOULD stop it receiving
                //TODO tell user it failed
                socket.emit('STOPPED', 'the upload was stopped');
                //TODO delete file?
            } else {

                console.log('COULD NOT FIND FILE', UUID);

            }


        }
    });
    return io;
};
