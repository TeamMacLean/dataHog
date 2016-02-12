"use strict";
/* exported sampleNCBI */
/* globals $, tax */
$(function () {
  sampleNCBI();
});

function sampleNCBI() {

  var ncbi = $('#ncbi');
  //var ul = $('#listByText');
  var sciName = $('#scientificName');
  var commonName = $('#commonName');

  //if (ncbi && ul && org) {
  function updateFromNumber() {

    var val = ncbi.val();
    tax.eFetch(val, function (err, out) {

      console.log('OUT!', out);

      if (out && out.Taxon) {
        sciName.empty();
        commonName.empty();
        sciName.val(out.Taxon.ScientificName);
        var optionsAsString = "";

        if (out.Taxon.OtherNames && out.Taxon.OtherNames.length > 0) {

          for (var i = 0; i < out.Taxon.OtherNames.length; i++) {
            var ob = out.Taxon.OtherNames[i];
            if (ob.CommonName) {
              optionsAsString += "<option value='" + ob.CommonName + "'>" + ob.CommonName + "</option>";
            }
          }
        }

        if (optionsAsString.length < 1) {
          var shortSciName = out.Taxon.ScientificName.split(' ')[0] || out.Taxon.ScientificName.s;
          optionsAsString += "<option value='" + shortSciName + "'>" + shortSciName + "</option>";

        }

        commonName.append(optionsAsString);


      } else {
        //TODO LET THEM KNOW!!
      }
    });


  }

  //function updateFromText() {
  //  var val = org.val();
  //  tax.eSpell(val, function (err, res) {
  //    if (res) {
  //      tax.eSearch(res, function (err, out) {
  //        if (out.length > 0) {
  //
  //          ul.empty();
  //          var li = $('<li></li>');
  //          var a = $('<a href="#ncbi">' + res + '</a>');
  //          li.append(a);
  //          a.on('click', function () {
  //            ncbi.val(out[0]);
  //            ul.empty();
  //            updateFromNumber();
  //          });
  //          ul.append(a);
  //
  //        }
  //      });
  //    }
  //  });
  //}

  ncbi.on('input', function () {
    var val = ncbi.val();
    if (!isNaN(val)) {
      updateFromNumber();
    }

  });

  //org.on('input', function () {
  //  var val = org.val();
  //
  //
  //  if (isNaN(val)) {
  //    updateFromText();
  //  }
  //
  //
  //});
  //}
}