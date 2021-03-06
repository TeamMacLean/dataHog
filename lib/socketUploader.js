var fs = require('fs');
var path = require('path');
var config = require('../config.json');

var tmp = config.tmpDir;
var Upload = require('../models/upload');
var CHUNK_SIZE = 102400;
var MAX_BUFFER_SIZE = CHUNK_SIZE * 10;


module.exports = function (io) {

    io.sockets.on('connection', function (socket) {

        function sendError(err) {
            socket.emit('error', err);
        }

        var Files = {};

        socket.on('disconnect', function () {
            userLeft();
        });

        socket.on('reset', function () {
            console.log('resetting');
            Files = {};
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
                    Dir: data['Dir'],
                    Complete: false
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
                    // console.error('failed to stat file', outPath);
                    //did not find that file
                } //It's a New File
                fs.open(outPath, "a", 775, function (err, fd) {
                    if (err) {
                        console.log(err);
                        sendError(err);
                        fs.closeSync(fd)
                    }
                    else {
                        Files[UUID]['Handler'] = fd; //We store the file handler so we can write to it later
                        socket.emit('MoreData', {'Place': Place, Percent: 0, UUID: UUID});
                    }
                });
            }).error(function (err) {
                sendError(err);
                console.error(err);
            });
        });
        socket.on('Upload', function (data) {
            var UUID = data['UUID'];

            if (Files[UUID]) {

                Files[UUID]['Downloaded'] += data['Data'].length;
                Files[UUID]['Data'] += data['Data'];

                if (!data['Data'].length) {
                    console.log('I think the upload failed, there was not data');
                }

                if (Files[UUID]['Downloaded'] === Files[UUID]['FileSize']) //If File is Fully Uploaded
                {
                    fs.write(Files[UUID]['Handler'], Files[UUID]['Data'], null, 'Binary', function (err, Writen) {
                        if (err) {
                            sendError(err);
                            console.log('error!', err);
                            if (fs.existsSync(file['Handler'])) {
                                fs.closeSync(Files[UUID]['Handler']);
                            }
                        }

                        Files[UUID].Complete = true;

                        console.log('upload complete', Files[UUID]['Path']);
                        socket.emit('Complete', {UUID: UUID, Path: Files[UUID]['Path']});
                        fs.closeSync(Files[UUID]['Handler']); //CLOSE FILE
                    });
                }
                else if (Files[UUID]['Data'].length > MAX_BUFFER_SIZE) { //If the Data Buffer reaches max
                    fs.write(Files[UUID]['Handler'], Files[UUID]['Data'], null, 'Binary', function (err, Writen) {
                        if (err) {
                            sendError(err);
                            console.log('error!', err);
                            if (fs.existsSync(file['Handler'])) {
                                fs.closeSync(Files[UUID]['Handler']); //CLOSE FILE
                            }
                        }
                        Files[UUID]['Data'] = ""; //Reset The Buffer
                        var Place = Files[UUID]['Downloaded'] / CHUNK_SIZE;
                        var Percent = (Files[UUID]['Downloaded'] / Files[UUID]['FileSize']) * 100;
                        socket.emit('MoreData', {'Place': Place, 'Percent': Percent, UUID: UUID});
                    });
                } else {
                    var Place = Files[UUID]['Downloaded'] / CHUNK_SIZE;
                    var Percent = (Files[UUID]['Downloaded'] / Files[UUID]['FileSize']) * 100;
                    //console.log('more 2')
                    socket.emit('MoreData', {'Place': Place, 'Percent': Percent, UUID: UUID});
                }
            } else {
                console.log('looks like we have already deleted', UUID);
            }

        });
        socket.on('Stop', function (UUID) {
            stopAndDelete(UUID);
        });

        function stopAndDelete(UUID) {

            if (UUID) {

                var path = Files[UUID].Path;


                console.log('closing open file');
                if (fs.existsSync(file['Handler'])) {
                    fs.closeSync(Files[UUID]['Handler']); //STOP THE FD

                }
                console.log('removing file from list');
                delete Files[UUID];

                socket.emit('STOPPED', 'the upload was stopped');
                try {
                    fs.unlink(path, function (err) {
                        if (err) {
                            sendError(err);
                        }
                        console.log('successfully deleted', path);
                    });
                } catch (err) {
                    sendError(err);
                }


            } else {
                console.log('UUID NOT VALID', UUID);
            }
        }

        function userLeft() {
            console.log('user left the session', 'will delete any unfinished uploads');


            for (var key in Files) {
                if (Files.hasOwnProperty(key)) {
                    // do stuff
                    var file = Files[key];
                    if (file.Path) {
                        if (file['Handler']) {
                            try {
                                if (fs.existsSync(file['Handler'])) {
                                    fs.closeSync(file['Handler']); //STOP THE FD
                                }

                            } catch (err) {
                                sendError(err);
                                // console.error('failed to close file handle, it might already be done', err);
                            }
                        }
                        if (!file['Complete']) {
                            fs.unlink(file.Path, function (err) {
                                if (err) throw err;
                                console.log('successfully deleted incomplete file', file.Path);
                            });
                        }

                    }

                }
            }


        }

    });
    return io;
};
