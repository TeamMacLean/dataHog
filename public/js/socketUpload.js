$(document).ready(function () {
  var Files = {};
  var socket = io(window.location.host);

  var uploadButton = $('#socketUpload');
  var form = $("form");
  if (form && uploadButton.length) {
    if (window.File && window.FileReader) {
      uploadButton.on('click', function (event) {
          event.preventDefault();

          //form.validate({
          //  debug: true
          //});

          //console.log('form', form);

          uploadButton.prop('disabled', true);

          reset();

          $('input[type="file"]').each(function () {
            if ($(this)[0].files.length > 0) {
              var input = $(this);

              function StartUpload(input) {
                var uuid = generateUUID();
                Files[uuid] = input.files[0];
                Files[uuid].input = input;
                Files[uuid].bar = $(input).parent().find('.meter');
                Files[uuid].bar.show();
                Files[uuid].FReader = new FileReader();

                Files[uuid].FReader.onloadend = function (evnt) {
                  socket.emit('Upload', {'Name': Files[uuid].name, Data: evnt.target.result, 'UUID': uuid});
                };
                socket.emit('Start', {
                  'Name': Files[uuid].name,
                  'Size': Files[uuid].size,
                  'Dir': window.location.pathname,
                  'UUID': uuid
                });
              }

              StartUpload(input[0]);

            } else {
              console.log('no files', $(this));
            }
          });
        }
      );
    } else {
      alert("Your Browser Doesn't Support The File API Please Update Your Browser");
    }
  } else {
    console.log('not a upload page');
  }


  socket.on('Complete', function (data) {
    console.log('complete');
    UpdateBar(Files[data.UUID].bar, 100);
    //console.log(data);
    //alert('saved on server at ' + data.Path);


    var input = $(Files[data.UUID].input);
    var nmval = input.attr('name');
    var name = 'hidden' + nmval.substring(nmval.indexOf('-'));

    input.parent().append($('<input type="hidden" value="' + data.UUID + '" id="' + name + '" name="' + name + '">'));

    Files[data.UUID] = null;
    //TODO add uuid as hidden field with file input
    //TODO check if all files uploaded & POST form


    uploadButton.prop('disabled', false);
  });

  socket.on('MoreData', function (data) {
    console.log('more');
    var File = Files[data.UUID];
    UpdateBar(File.bar, data.Percent);
    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
    var NewFile; //The Variable that will hold the new Block of Data
    if (File.slice) {
      NewFile = File.slice(Place, Place + Math.min(524288, (File.size - Place)));
    }
    else if (File.webkitSlice) {
      NewFile = File.webkitSlice(Place, Place + Math.min(524288, (File.size - Place)));
    }
    else if (File.mozSlice) {
      NewFile = File.mozSlice(Place, Place + Math.min(524288, (File.size - Place)));
    } else {
      alert('Sorry but your browser does not support this');
    }
    console.log('going to start', File.FReader, File);
    File.FReader.readAsBinaryString(NewFile);
  });


  function reset() {
    Files = {};
    socket.emit('reset');
  }

  function UpdateBar(bar, percent) {
    bar
      .find('span')
      .width(percent + '%')
      .text(Math.round(percent) + '%');
  }


  function generateUUID() {
    var d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };
})
;

