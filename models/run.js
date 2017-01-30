"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var util = require('../lib/util');
var config = require('../config.json');
var js2xmlparser = require('js2xmlparser');

var Run = thinky.createModel('Run', {
    id: type.string(),
    sampleID: type.string().required(),
    name: type.string().required(),
    libraryType: type.string().required(),
    sequencingProvider: type.string().required(),
    sequencingTechnology: type.string().required(),
    librarySource: type.string().required(),
    librarySelection: type.string().required(),
    libraryStrategy: type.string().required(),
    insertSize: type.string().required(),
    submissionToGalaxy: type.boolean().required(), //TODO send email
    path: type.string().required(),
    safeName: type.string().required(),
    accession: type.string(),
    alias: type.string()
});

Run.define("hpcPath", function () {
    if (config.hpcRoot) {
        return config.hpcRoot + this.path;
    } else {
        return this.path;
    }
});

Run.pre('save', function (next) {
    var run = this;
    var unsafeName = run.name;
    if (!run.safeName) {

        run.additionalFiles = [];

        Run.filter({sampleID: run.sampleID}).run().then(function (result) {
            //TODO works to here (without additional)
            util.generateSafeName(unsafeName, result, function (name) {
                run.safeName = name;
                util.generateUniqueName(run.name, result, function (newName) {
                    run.name = newName;
                    Sample.get(run.sampleID).run().then(function (sample) {
                        run.path = sample.path + '/' + run.safeName;
                        next();
                    });
                });
            });
        });
    }
});

Run.define('toENA', function () {

    var runObj = {
        "RUN": {
            "@": {
                "alias": this.safeName,
                "run_date": "2008-02-07T00:00:00.000Z",
                "run_center": config.ena.namespace,
                "center_name": config.ena.namespace
            },
            "IDENTIFIERS": {
                "SUBMITTER_ID": {
                    "@": {
                        "namespace": config.ena.namespace
                    },
                    "#": this.safeName
                }
            },
            "EXPERIMENT_REF": {
                "@": {
                    "accession": "ERX000536",
                    "refname": "PssB728a_assembly",
                    "refcenter": "JIC"
                },
                "IDENTIFIERS": {
                    "SUBMITTER_ID": {
                        "@": {
                            "namespace": config.ena.namespace
                        },
                        "#": "PssB728a_assembly"
                    }
                }
            },
            //"DATA_BLOCK": {
            //  "FILES": {
            //    "FILE": {
            //      "@": {
            //        "filename": "test.fastq.gz",
            //        "filetype": "fastq",
            //        "quality_scoring_system": "log-odds",
            //        "ascii_offset": "@",
            //        "quality_encoding": "ascii",
            //        "checksum": "ee9e99f9277bc98c74ec63efa107c58d",
            //        "checksum_method": "MD5"
            //      }
            //    }
            //  }
            //},
            //"RUN_ATTRIBUTES": {
            //  "RUN_ATTRIBUTE": [
            //    {
            //      "TAG": "run",
            //      "VALUE": "1"
            //    },
            //    {
            //      "TAG": "total_bases",
            //      "VALUE": "255681576",
            //      "UNITS": "bp"
            //    },
            //    {
            //      "TAG": "actual_read_length",
            //      "VALUE": "72"
            //    }
            //  ]
            //}
        }
    };

    return js2xmlparser("RUN_SET", runObj);

//  var fake = `
//  <?xml version="1.0" encoding="UTF-8"?><RUN_SET>
//    <RUN alias="thisisatest" run_date="2008-02-07T00:00:00.000Z" run_center="JIC" center_name="JIC">
//        <IDENTIFIERS>
//            <SUBMITTER_ID namespace="JIC">thisisatest</SUBMITTER_ID>
//        </IDENTIFIERS>
//        <EXPERIMENT_REF accession="ERX000536" refname="PssB728a_assembly" refcenter="JIC">
//            <IDENTIFIERS>
//                <SUBMITTER_ID namespace="JIC">PssB728a_assembly</SUBMITTER_ID>
//            </IDENTIFIERS>
//        </EXPERIMENT_REF>
//        <DATA_BLOCK>
//            <FILES>
//                <FILE filename="test.fastq.gz" filetype="fastq" quality_scoring_system="log-odds" ascii_offset="@" quality_encoding="ascii" checksum="ee9e99f9277bc98c74ec63efa107c58d" checksum_method="MD5"/>
//            </FILES>
//        </DATA_BLOCK>
//        <RUN_ATTRIBUTES>
//            <RUN_ATTRIBUTE>
//                <TAG>run</TAG>
//                <VALUE>1</VALUE>
//            </RUN_ATTRIBUTE>
//            <RUN_ATTRIBUTE>
//                <TAG>total_bases</TAG>
//                <VALUE>255681576</VALUE>
//                <UNITS>bp</UNITS>
//            </RUN_ATTRIBUTE>
//            <RUN_ATTRIBUTE>
//                <TAG>actual_read_length</TAG>
//                <VALUE>72</VALUE>
//            </RUN_ATTRIBUTE>
//        </RUN_ATTRIBUTES>
//    </RUN>
//</RUN_SET>`;
//  return fake;
});

module.exports = Run;

var Sample = require('./sample');
var Read = require('./read');
var AdditionalFile = require('./additionalFile');
Run.hasMany(Read, 'reads', 'id', 'runID');
Run.belongsTo(Sample, 'sample', 'sampleID', 'id');
Run.hasMany(AdditionalFile, 'additionalFiles', 'id', 'parentID');