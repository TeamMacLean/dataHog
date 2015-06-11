var fileInputCount = 0;

var pairedOrMated = false;

var filesRoot;

$(function () {
  initAddFileInput();
});

function initAddFileInput() {

  var libType = $('#libraryType');

  libType.on('change', function () {
    updatePairedOrMated();
    resetSelectedFiles();
  });


  function updatePairedOrMated() {
    var libTypeText = $('#libraryType option:selected').text();
    pairedOrMated = !!(libTypeText == 'paired' || libTypeText == 'mate');
  }

  if (libType == 'paired' || libType == 'mate') {
    pairedOrMated = true;
  }


  filesRoot = $('#filesRoot');

  $('.addFileInput').map(function () {
    var el = $(this);
    el.on('click', function () {
      addFileInput();
    })
  });

  //add the initial input
  addFileInput();
}

function resetSelectedFiles() {
  fileInputCount = 0;
  filesRoot.empty();
  addFileInput();
}

function addFileInput() {


  var fieldSet = $('<fieldset/>').addClass('file-group');

  function addAll() {
    fileInputCount += 1;
    var name = 'file-' + fileInputCount;
    var md5Name = 'MD5-' + fileInputCount;

    var label = $('<label/>').attr('for', name).append("add file here");
    var input = $('<input/>').attr('type', 'file').attr('name', name).attr('id', name).attr('accept','.fq,.fastq');
    var md5Label = $('<label/>').attr('for', md5Name).append("MD5");
    var md5Input = $('<input/>').attr('type', 'text').attr('name', md5Name).attr('id', md5Name).prop('required', true);

    fieldSet.append(label);
    fieldSet.append(input);
    fieldSet.append(md5Label);
    fieldSet.append(md5Input);
  }

  addAll();
  if (pairedOrMated) {
    addAll();
  }


  filesRoot.append(fieldSet);

}

