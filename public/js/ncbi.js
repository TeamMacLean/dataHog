"use strict";
/* exported sampleNCBI */
$(function () {
  sampleNCBI();
});

function sampleNCBI() {

  var ncbi = $('#ncbi');
  var ul = $('#listByText');
  var org = $('#organism');

  //if (ncbi && ul && org) {
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
            ul.append(a);

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
  //}
}