var fs = require('fs');
var Buffer = require('buffer').Buffer;

/**
 *
 * @param offset
 * @param length
 * @param file
 * @param cb
 */

var readBytes = function (offset, length, file, cb) {

  fs.exists(file, function (exists) {
    if (exists) {
      fs.open(file, "r", function (error, fd) {
        if (error) {
          return cb(error);
        }
        var buffer = new Buffer(length);

        //file, buffer to write to, buffer offset, read length, start position, cb
        fs.read(fd, buffer, 0, buffer.length, offset, function (error, bytesRead, buffer) {
          if (error) {
            return cb(error);
          }
          //Just return the buffer, let the functions handle what to do with it
          var data = buffer;
          fs.close(fd);
          return cb(null, data);
        });
      });
    }
  });

};

function bufferToAscii(buffer) {
  return buffer.toString("ascii", 0, buffer.length);
}

function intFromBytes(x) {
  var val = 0;
  for (var i = 0; i < x.length; ++i) {
    val += x[i];
    if (i < x.length - 1) {
      val = val << 8;
    }
  }
  return val;
}

var decodeDirectory = function (buffer, cb) {

  var dirEntry = {
    name: bufferToAscii(buffer.slice(0, 4)),
    number: intFromBytes(buffer.slice(4, 8)),
    elementType: intFromBytes(buffer.slice(8, 10)),
    elementSize: intFromBytes(buffer.slice(10, 12)),
    numElements: intFromBytes(buffer.slice(12, 16)),
    dataSize: intFromBytes(buffer.slice(16, 20)),
    dataOffset: intFromBytes(buffer.slice(20, 24)),
    dataHandle: intFromBytes(buffer.slice(24, 28))
  };

  cb(null, dirEntry);
  return dirEntry;
};

function Abi(file) {
  this.file = file;
}

Abi.prototype.checkHeader = function (cb) {

  readBytes(0, 4, this.file, function (err, data) {
    if (err) {
      return cb(err);
    } else {
      var bufferString = bufferToAscii(data);
      if (bufferString !== 'ABIF') {
        return cb(new Error('this is not a ABIFs file'));
      }
      cb(null, bufferString);
      return bufferString;
    }
  });
};

Abi.prototype.version = function (cb) {
  readBytes(4, 2, this.file, function (err, data) {
    if (err) {
      return cb(err);
    } else {
      var version = intFromBytes(data);
      cb(null, version);
      return version;
    }

  });
};


Abi.prototype.entryDirectory = function (cb) {

  readBytes(6, 28, this.file, function (err, buffer) {
    if (err) {
      return cb(err);
    } else {
      decodeDirectory(buffer, function (err, dir) {
        if (err) {
          return cb(err);
        } else {
          cb(null, dir);
        }
      })
    }
  });
};

Abi.prototype.getDirectories = function (entryDir, cb) {

  var base = 128; //bytes
  var length = 28; //bytes

  var out = [];

  for (var i = 0; i < entryDir.numElements; i++) {
    var offset = entryDir.dataOffset * i;
    var from = base + offset;


    readBytes(from, length, this.file, function (err, buffer) {

      decodeDirectory(buffer, function (err, data) {
        //if (err) {
        //    console.log(err);
        //}
        out.push(data);
        if (out.length == entryDir.numElements) {
          cb(null, out);
        }
      });
    });
    //TODO call this after loop finished

  }
};

module.exports = Abi;