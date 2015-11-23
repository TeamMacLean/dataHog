var js2xmlparser = require('js2xmlparser');
var config = require('./config.json');

///////////////////////////////////////Sample

//var Sample = require('./models/sample');
//Sample.run().then(function (samples) {
//
//  var sample = samples[0];
//  var sampleObj = {
//    "SAMPLE": {
//      "@": {
//        "alias": sample.safeName,
//        "center_name": config.ena.namespace
//      },
//      "IDENTIFIERS": {
//        "SUBMITTER_ID": {
//          "@": {
//            "namespace": config.ena.namespace
//          },
//          "#": sample.safeName
//        }
//      },
//      "SAMPLE_NAME": {
//        "TAXON_ID": sample.ncbi,
//        "COMMON_NAME": sample.organism, //TODO
//        "SCIENTIFIC_NAME": sample.organism //TODO
//      }
//    }
//  };
//  console.log(js2xmlparser("SAMPLE_SET", sampleObj));
//});

///////////////////////////////////////Study

//var studyObj = {
//  "STUDY": {
//    "@": {
//      "alias": "thisisatest",
//      "center_name": "JIC"
//    },
//    "IDENTIFIERS": {
//      "SUBMITTER_ID": {
//        "@": {
//          "namespace": "JIC"
//        },
//        "#": "thisisatest"
//      }
//    },
//    "DESCRIPTOR": {
//      "STUDY_TITLE": "Identification of causative SNPs in the mob54-3/mob56-1BC mutants derived from bak1-5 remutagenesis",
//      "STUDY_ABSTRACT": "lots of text",
//      "STUDY_DESCRIPTION": "lots of text",
//      "CENTER_PROJECT_NAME": "Variant detection in A. thaliana mob mutants mob54-3/mob56-1BC",
//      "STUDY_TYPE": {
//        "@": {
//          "existing_study_type": "other"
//        }
//      }
//    }
//  }
//};
//
//console.log(js2xmlparser("STUDY_SET", studyObj));


///////////////////////////////////////Submission


var submissionObj = {
  "SUBMISSION": {
    "center_name": "JIC",
    "IDENTIFIERS": {
      "SUBMITTER_ID": {
        "@": {
          "namespace": "JIC"
        },
        "#": "thisisatest"
      }
    },
    "ACTIONS": {
      "ACTION": [
        {
          "RELEASE": {}
        },
        {
          "ADD": {}
        },
        {
          "ADD": {}
        }
      ]
    }
  }
};
console.log(js2xmlparser("SUBMISSION_SET", submissionObj));

///////////////////////////////////////Run

var runObj = {
  "RUN": {
    "@": {
      "alias": "thisisatest", "run_date": "2008-02-07T00:00:00.000Z", "run_center": "JIC", "center_name": "JIC"
    },
    "IDENTIFIERS": {
      "SUBMITTER_ID": {
        "@": {
          "namespace": "JIC",
        },
        "#": "thisisatest"
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
            "namespace": "JIC"
          },
          "#": "PssB728a_assembly"
        }
      }
    },
    "DATA_BLOCK": {
      "FILES": {
        "FILE": {
          "filename": "test.fastq.gz",
          "filetype": "fastq",
          "quality_scoring_system": "log-odds",
          "ascii_offset": "@",
          "quality_encoding": "ascii",
          "checksum": "ee9e99f9277bc98c74ec63efa107c58d",
          "checksum_method": "MD5"
        }
      }
    },
    "RUN_ATTRIBUTES": {
      "RUN_ATTRIBUTE": [
        {
          "TAG": "run",
          "VALUE": "1"
        },
        {
          "TAG": "total_bases",
          "VALUE": "255681576",
          "UNITS": "bp"
        },
        {
          "TAG": "actual_read_length",
          "VALUE": "72"
        }
      ]
    }
  }
};

console.log(js2xmlparser("RUN_SET", runObj));

///////////////////////////////////////Experiment

var experimentObj = {
  "EXPERIMENT": {
    "-alias": "thisisatest",
    "-center_name": "JIC",
    "IDENTIFIERS": {
      "SUBMITTER_ID": {
        "-namespace": "JIC",
        "#text": "thisisatest"
      }
    },
    "STUDY_REF": {
      "-refname": "thisisatest",
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
        "LIBRARY_STRATEGY": "WGS",
        "LIBRARY_SOURCE": "GENOMIC",
        "LIBRARY_SELECTION": "RANDOM",
        "LIBRARY_LAYOUT": {
          "PAIRED": {
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
    },
    "EXPERIMENT_ATTRIBUTES": {
      "EXPERIMENT_ATTRIBUTE": [
        {
          "TAG": "expected_number_bases",
          "VALUE": "255",
          "UNITS": "MB"
        },
        {
          "TAG": "center_name",
          "VALUE": "The Sainsbury Laboratory"
        }
      ]
    }
  }
};

console.log(js2xmlparser("EXPERIMENT_SET", experimentObj));




