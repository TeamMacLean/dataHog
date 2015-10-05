var fileInputCount = 0;

var pairedOrMated = false;

var filesRoot;

$(function () {
  initAddFileInput();
  sampleNCBI();

});

function sampleNCBI() {

  var ncbi = $('#ncbi');
  var ul = $('#listByText');
  var org = $('#organism');

  if (ncbi && ul && org) {
    function updateFromNumber() {

      var val = ncbi.val();
      tax.eFetch(val, function (err, out) {

        console.log(out);

        if (out && out.Taxon) {
          org.val(out.Taxon.ScientificName);
        }
      });


    }

    function updateFromText() {
      var val = org.val();
      tax.eSpell(val, function (err, res) {
        if (res) {
          tax.eSearch(res, function (err, out) {
            if (out.length > 0) {

              ul.empty();
              var li = $('<li></li>');
              var a = $('<a href="#ncbi">' + res + '</a>');
              li.append(a);
              a.on('click', function () {
                ncbi.val(out[0]);
                ul.empty();
                updateFromNumber();
              });
              ul.append(a)

            }
          });
        }
      });
    }

    ncbi.on('input', function () {
      var val = ncbi.val();
      if (!isNaN(val)) {
        updateFromNumber();
      }

    });

    org.on('input', function () {
      var val = org.val();


      if (isNaN(val)) {
        updateFromText();
      }


    });
  }
}

function initAddFileInput() {

  var libType = $('#libraryType');

  libType.on('change', function () {
    updatePairedOrMated();
    resetSelectedFiles();
  });

  //TODO for chris
  updatePairedOrMated();

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

function removeFileInput(a) {
  a.target.parentElement.remove();
}

function addFileInput() {


  var fieldSet = $('<fieldset/>').addClass('file-group');

  function addAll(anything) {
    fileInputCount += 1;
    var name = 'file-' + fileInputCount;
    var md5Name = 'MD5-' + fileInputCount;

    var label = $('<label/>').attr('for', name).append("File");
    var input = $('<input/>').attr('type', 'file').attr('name', name).attr('id', name).attr('accept', '.fq,.fastq');
    var md5Label = $('<label/>').attr('for', md5Name).append("File's MD5");
    var md5Input = $('<input/>').attr('type', 'text').attr('name', md5Name).attr('id', md5Name).prop('required', true);

    var removeButton = $('<input/>').attr('type', 'button').attr('value', 'Remove').addClass('error').on('click', removeFileInput);

    var isSecondInput = pairedOrMated && anything;
    var onlyInput = !pairedOrMated && !anything;

    if (!onlyInput) {
      if (!isSecondInput) {
        label.text('1/2');
      } else {
        label.text('2/2');
      }
      console.log(label)
    }


    fieldSet.append(label);
    fieldSet.append(input);
    fieldSet.append($('<br/><br/>'));
    fieldSet.append(md5Label);
    fieldSet.append(md5Input);
    if (isSecondInput || onlyInput) {
      fieldSet.append($('<br/><br/>'));
      fieldSet.append(removeButton);
    }
    if (!isSecondInput) {
      fieldSet.append($('<br/><br/>'));
    }
  }

  addAll();
  if (pairedOrMated) {
    addAll(2);
  }


  filesRoot.append(fieldSet);

}

