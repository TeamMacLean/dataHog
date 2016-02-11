"use strict";

var thinky = require('../lib/thinky.js');
var r = thinky.r;
var type = thinky.type;
var js2xmlparser = require('js2xmlparser');
var moment = require('moment');
var config = require('../config.json');
var async = require('async');
var path = require('path');
var fs = require('fs');
var parseString = require('xml2js').parseString;
var ENA = require('../lib/ena');
var Run = require('../models/run');
var Sample = require('../models/sample');
var Project = require('../models/project');
var Email = require('../lib/email');

var Submission = thinky.createModel('Submission', {
  id: type.string(),
  createdAt: type.date().default(r.now()),
  holdDate: type.date().required(),
  runID: type.string().required(),
  receipt: type.string(),
  accession: type.string(),
  alias: type.string()
});

Submission.pre('save', function (next) {
  this.holdDate = moment().add(2, 'years').subtract(1, 'months').format('YYYY-MM-DD');
  next();
});

Submission.define("toENA", function () {

  var self = this;

  var id = Date.now(); //TODO BAD

  this.holdDate = moment().add(2, 'years').subtract(1, 'months').format('YYYY-MM-DD');


  console.log('HOLDING UNTIL', this.holdDate);

  return `<?xml version="1.0" encoding="UTF-8"?>
<SUBMISSION_SET>
    <SUBMISSION center_name="JIC">
        <IDENTIFIERS>
            <SUBMITTER_ID namespace="JIC">${id}</SUBMITTER_ID>
        </IDENTIFIERS>
        <ACTIONS>
            <ACTION>
                <!--<RELEASE/> will be immediate is this is uncommented-->
                <HOLD HoldUntilDate="${self.holdDate}"/>
            </ACTION>
            <ACTION>
                <ADD schema="run" source="run.xml"/>
            </ACTION>
            <ACTION>
                <ADD schema="study" source="study.xml"/>
            </ACTION>
            <ACTION>
                <ADD schema="sample" source="sample.xml"/>
            </ACTION>
        </ACTIONS>
    </SUBMISSION>
</SUBMISSION_SET>`;
});


Submission.define('submit', function () {

  var self = this;

  Run.get(this.runID).getJoin({additionalFiles: true, reads: true, sample: {project: true}}).run().then(function (run) {

    //var run = runs[runs.length - 1];
    var sample = run.sample;
    var project = sample.project;


    async.eachSeries(run.reads, function iterator(read, theNextOne) {

      var filePath = path.join(config.dataDir, read.path);

      console.log('uploading', filePath);
      ENA.upload(filePath, read.fileName, function (err) {
        theNextOne(err);
      });


    }, function done(err) {

      if (err) {
        console.error(err);
      } else {
        console.log('uploaded OK');
      }


      var subENA = null;
      var runENA = null;
      //var experimentENA = null;
      var studyENA = null;

      //TODO dont resubmit studys etc

      if (!self.accession) {
        subENA = xmlToFile('submission.xml', self.toENA());
      }

      if (!run.accession) {
        runENA = xmlToFile('run.xml', run.toENA());
      }

      if (!sample.accession) {
        var sampleENA = xmlToFile('sample.xml', sample.toENA());
      }

      if (!project.accession) {
        studyENA = xmlToFile('study.xml', project.toENA());
      }

      //TODO always submit new? (its based on run, so probably)
      var experimentXML = genExperiment(run, project);
      var experimentENA = xmlToFile('experiment.xml', experimentXML);
      //TODO END

      ENA.submit(subENA, studyENA, sampleENA, experimentENA, runENA, function (err, response) {

        if (err) {
          console.error(err);
        } else {

          parseString(response, function (err, result) {
            if (err) {
              console.error(err);
            } else {

              var RECEIPT = result.RECEIPT;

              var success = RECEIPT['$'].success == 'true';
              var receiptDate = RECEIPT['$'].receiptDate;

              if (success) {

                console.log('updating records with accessions');

                //TODO update the run, sample, study and submission with their accession id

                var runAccession = RECEIPT['RUN'];
                var sampleAccession = RECEIPT['SAMPLE'];
                var studyAccession = RECEIPT['STUDY'];
                var submissionAccession = RECEIPT['SUBMISSION'];

                if (runAccession && runAccession['$']) {

                  Run.get(run.id).update({
                    accession: runAccession['$'].accession,
                    alias: runAccession['$'].alias
                  }).run().then(function (result) {
                    run = result;
                  })
                }
                if (sampleAccession && sampleAccession['$']) {
                  Sample.get(run.id).update({
                    accession: sampleAccession['$'].accession,
                    alias: sampleAccession['$'].alias
                  }).run().then(function (result) {
                    sample = result;
                  })
                }
                if (studyAccession && studyAccession['$']) {
                  Project.get(run.id).update({
                    accession: studyAccession['$'].accession,
                    alias: studyAccession['$'].alias
                  }).run().then(function (result) {
                    project = result;
                  })
                }
                if (submissionAccession && submissionAccession['$']) {
                  Submission.get(self.id).update({
                    accession: submissionAccession['$'].accession,
                    alias: submissionAccession['$'].alias
                  }).run().then(function (result) {
                    self = result;
                  })
                }

              } else {
                console.log('it failed!!!')
              }


              var statusText = success ? 'SUCCESS' : 'FAILED';

              console.log('received:', receiptDate);

              console.log('status:', statusText);

              RECEIPT.MESSAGES.map(function (message) {
                console.log(message);
              });

              console.log('--------------------------------------------------');
              console.log(RECEIPT);

              var receiptString = JSON.stringify(RECEIPT, null, '\t');

              self.receipt = receiptString;
              self.save();

              Email.send('ENA SUBMISSION SENT ' + self.id, receiptString);
            }
          });
        }
      });
    });
  });
});

function xmlToFile(name, xml) {
  var path = '/tmp/' + name;

  fs.writeFileSync(path, xml, 'utf8');
  return path;
}

function genExperiment(run, project) {

  var experimentObj = {
    "EXPERIMENT": {
      "-alias": run.safeName,
      "-center_name": "JIC",
      "IDENTIFIERS": {
        "SUBMITTER_ID": {
          "-namespace": "JIC",
          "#text": "thisisatest"
        }
      },
      "STUDY_REF": {
        "-refname": project.safeName,
        "-refcenter": "JIC",
        "IDENTIFIERS": {
          "SUBMITTER_ID": {
            "-namespace": "JIC",
            "#text": "thisisatest"
          }
        }
      },
      "DESIGN": {
        "DESIGN_DESCRIPTION": "Solexa sequencing of Pseudomonas syringae pathovar syringae B728a",
        "SAMPLE_DESCRIPTOR": {
          "-refname": "thisisatest",
          "-refcenter": "JIC",
          "IDENTIFIERS": {
            "SUBMITTER_ID": {
              "-namespace": "JIC",
              "#text": "thisisatest"
            }
          }
        },
        "LIBRARY_DESCRIPTOR": {
          "LIBRARY_NAME": "PssB728a",
          "LIBRARY_STRATEGY": run.libraryStrategy,
          "LIBRARY_SOURCE": run.librarySource,
          "LIBRARY_SELECTION": run.librarySelection,
          "LIBRARY_LAYOUT": {
            "PAIRED": { //TODO run.libraryType.toUpperCase()
              "-NOMINAL_LENGTH": "500",
              "-NOMINAL_SDEV": "0.0"
            }
          },
          "LIBRARY_CONSTRUCTION_PROTOCOL": "Standard Solexa protocol"
        },
        "SPOT_DESCRIPTOR": {
          "SPOT_DECODE_SPEC": {
            "SPOT_LENGTH": "72",
            "READ_SPEC": [
              {
                "READ_INDEX": "0",
                "READ_CLASS": "Application Read",
                "READ_TYPE": "Forward",
                "BASE_COORD": "1"
              },
              {
                "READ_INDEX": "1",
                "READ_CLASS": "Application Read",
                "READ_TYPE": "Reverse",
                "BASE_COORD": "37"
              }
            ]
          }
        }
      },
      "PLATFORM": {
        "ILLUMINA": {"INSTRUMENT_MODEL": "Illumina Genome Analyzer"}
      }
      //"EXPERIMENT_ATTRIBUTES": {
      //  "EXPERIMENT_ATTRIBUTE": [
      //    {
      //      "TAG": "expected_number_bases",
      //      "VALUE": "255",
      //      "UNITS": "MB"
      //    },
      //    {
      //      "TAG": "center_name",
      //      "VALUE": "The Sainsbury Laboratory"
      //    }
      //  ]
      //}
    }
  };

  return js2xmlparser("EXPERIMENT_SET", experimentObj);
}

module.exports = Submission;