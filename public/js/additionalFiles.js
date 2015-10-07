$(function () {
  initAdditional();
});

var additionalCount = 0;
var root;

function initAdditional() {
  root = $('#additionalData');

  if (root.length) {

    $('#additionalDataDiv').find('.addFileInput').map(function () {
      var el = $(this);
      el.on('click', function () {
        addAdditionalInput();
      })
    });

    addAdditionalInput();
  }

  function removeAdditional(a) {
    a.target.parentElement.remove();
  }

  function addAdditionalInput() {
    additionalCount++;


    var name = 'additional-' + additionalCount;
    var fieldSet = $('<fieldset/>').addClass('file-group');
    //var label = $('<label/>').attr('for', name).append("Additional data");
    var input = $('<input/>').attr('type', 'file').attr('id', name).attr('name', name);
    input.prop('required', true);


    //fieldSet.append(label);
    fieldSet.append(input);
    var removeButton = $('<input/>').attr('type', 'button').attr('value', 'Remove').addClass('error').on('click', removeAdditional);
    fieldSet.append($('<br/><br/>'));
    fieldSet.append(removeButton);

    $('#additionalData').append(fieldSet);


    //
    //var fieldSet = $('<fieldset/>').addClass('file-group');
    //
    //function addAll(anything) {
    //  fileInputCount += 1;
    //  var name = 'file-' + fileInputCount;
    //  var md5Name = 'MD5-' + fileInputCount;
    //
    //  var label = $('<label/>').attr('for', name).append("File");
    //  var input = $('<input/>').attr('type', 'file').attr('name', name).attr('id', name).attr('accept', '.fq,.fastq');
    //  var md5Label = $('<label/>').attr('for', md5Name).append("File's MD5");
    //  var md5Input = $('<input/>').attr('type', 'text').attr('name', md5Name).attr('id', md5Name).prop('required', true);
    //
    //  var removeButton = $('<input/>').attr('type', 'button').attr('value', 'Remove').addClass('error').on('click', removeFileInput);
    //
    //  var isSecondInput = pairedOrMated && anything;
    //  var onlyInput = !pairedOrMated && !anything;
    //
    //  if (!onlyInput) {
    //    if (!isSecondInput) {
    //      label.text('1/2');
    //    } else {
    //      label.text('2/2');
    //    }
    //    console.log(label)
    //  }
    //
    //
    //  fieldSet.append(label);
    //  fieldSet.append(input);
    //  fieldSet.append($('<br/><br/>'));
    //  fieldSet.append(md5Label);
    //  fieldSet.append(md5Input);
    //  if (isSecondInput || onlyInput) {
    //    fieldSet.append($('<br/><br/>'));
    //    fieldSet.append(removeButton);
    //  }
    //  if (!isSecondInput) {
    //    fieldSet.append($('<br/><br/>'));
    //  }
    //}
    //
    //addAll();
    //if (pairedOrMated) {
    //  addAll(2);
    //}
    //
    //
    //filesRoot.append(fieldSet);

  }
}

