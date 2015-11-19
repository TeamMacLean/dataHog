var js2xmlparser = require('js2xmlparser');

//Sample
var Sample = require('./models/sample');
Sample.run().then(function (samples) {

  var sample = samples[0];
  var sampleObj = {
    "SAMPLE": {
      "@": {
        "alias": "thisisatest",
        "center_name": "JIC"
      },
      "IDENTIFIERS": {
        "SUBMITTER_ID": {
          "@": {
            "namespace": "JIC"
          },
          "#": "thisisatest"
        }
      },
      "SAMPLE_NAME": {
        "TAXON_ID": 205918,
        "COMMON_NAME": "Pseudomonas syringae pathovar syringae B728a",
        "SCIENTIFIC_NAME": "Pseudomonas syringae pv. syringae B728a"
      }
    }
  };

//<?xml version="1.0" encoding="UTF-8"?><SAMPLE_SET>
//  <SAMPLE alias="thisisatest" center_name="JIC">
//    <IDENTIFIERS>
//      <SUBMITTER_ID namespace="JIC">thisisatest</SUBMITTER_ID>
//    </IDENTIFIERS>
//    <SAMPLE_NAME>
//      <TAXON_ID>205918</TAXON_ID>
//      <COMMON_NAME>Pseudomonas syringae pathovar syringae B728a</COMMON_NAME>
//      <SCIENTIFIC_NAME>Pseudomonas syringae pv. syringae B728a</SCIENTIFIC_NAME>
//    </SAMPLE_NAME>
//  </SAMPLE>
//</SAMPLE_SET>

  //console.log(js2xmlparser("SAMPLE_SET", sampleObj));
});

//Study

var studyObj = {
  "STUDY": {
    "@": {
      "alias": "thisisatest",
      "center_name": "JIC"
    },
    "IDENTIFIERS": {
      "SUBMITTER_ID": {
        "@": {
          "namespace": "JIC"
        },
        "#": "thisisatest"
      }
    },
    "DESCRIPTOR": {
      "STUDY_TITLE": "Identification of causative SNPs in the mob54-3/mob56-1BC mutants derived from bak1-5 remutagenesis",
      "STUDY_ABSTRACT": "lots of text",
      "STUDY_DESCRIPTION": "lots of text",
      "CENTER_PROJECT_NAME": "Variant detection in A. thaliana mob mutants mob54-3/mob56-1BC",
      "STUDY_TYPE": {
        "@": {
          "existing_study_type": "other"
        }
      }
    }
  }
};

console.log(js2xmlparser("STUDY_SET", studyObj));

//<?xml version="1.0" encoding="UTF-8"?>
//<STUDY_SET>
//  <STUDY alias="thisisatest" center_name="JIC">
//    <IDENTIFIERS>
//      <SUBMITTER_ID namespace="JIC">thisisatest</SUBMITTER_ID>
//    </IDENTIFIERS>
//    <DESCRIPTOR>
//      <STUDY_TITLE>Identification of causative SNPs in the mob54-3/mob56-1BC mutants derived from bak1-5
//        remutagenesis
//      </STUDY_TITLE>
//      <STUDY_ABSTRACT>mob54-3 and mob56-1BC were isolated in a forward genetic screen to look for suppressor
//        mutants of bak1-5. The bak1-5 mutant is strongly affected in PTI signalling, such as PAMP-triggered ROS
//        burst. The mob54-3 mutation strongly restores PAMP-triggered ROS and also other PTI related phenotypes.
//        Furthermore, genetic characterization revealed that the mob54-3 mutation is semi-dominant, therefore,
//        the affected gene is likely to be a gain of function mutation in a positive regulator of PTI. The
//        mob56-1 mutation strongly restores PAMP-triggered seedling growth inhibition and also other PTI related
//        phenotypes. Furthermore, genetic characterization revealed that the mob56-1 mutation is fully recessive.
//        Therefore, the affected gene is likely to be a loss of function mutation in a negative regulator of PTI.
//      </STUDY_ABSTRACT>
//      <STUDY_DESCRIPTION>mob54-3 and mob56-1BC were isolated in a forward genetic screen to look for suppressor
//        mutants of bak1-5. The bak1-5 mutant is strongly affected in PTI signalling, such as PAMP-triggered ROS
//        burst. The mob54-3 mutation strongly restores PAMP-triggered ROS and also other PTI related phenotypes.
//        Furthermore, genetic characterization revealed that the mob54-3 mutation is semi-dominant, therefore,
//        the affected gene is likely to be a gain of function mutation in a positive regulator of PTI. The
//        mob56-1 mutation strongly restores PAMP-triggered seedling growth inhibition and also other PTI related
//        phenotypes. Furthermore, genetic characterization revealed that the mob56-1 mutation is fully recessive.
//        Therefore, the affected gene is likely to be a loss of function mutation in a negative regulator of PTI.
//      </STUDY_DESCRIPTION>
//      <CENTER_PROJECT_NAME>Variant detection in A. thaliana mob mutants mob54-3/mob56-1BC</CENTER_PROJECT_NAME>
//      <STUDY_TYPE existing_study_type="Other"/>
//    </DESCRIPTOR>
//  </STUDY>
//</STUDY_SET>

//Submission

//<?xml version="1.0" encoding="UTF-8"?>
//<SUBMISSION_SET>
//  <SUBMISSION center_name="JIC">
//    <IDENTIFIERS>
//      <SUBMITTER_ID namespace="JIC">thisisatest</SUBMITTER_ID>
//    </IDENTIFIERS>
//    <ACTIONS>
//      <ACTION>
//        <RELEASE/>
//      </ACTION>
//      <ACTION>
//        <ADD schema="experiment" source="experiment.xml"/>
//      </ACTION>
//      <ACTION>
//        <ADD schema="run" source="run.xml"/>
//      </ACTION>
//      <ACTION>
//        <ADD schema="study" source="study.xml"/>
//      </ACTION>
//      <ACTION>
//        <ADD schema="sample" source="sample.xml"/>
//      </ACTION>
//    </ACTIONS>
//  </SUBMISSION>
//</SUBMISSION_SET>

//Run

//<?xml version="1.0" encoding="UTF-8"?><RUN_SET>
//  <RUN alias="thisisatest" run_date="2008-02-07T00:00:00.000Z" run_center="JIC" center_name="JIC">
//    <IDENTIFIERS>
//      <SUBMITTER_ID namespace="JIC">thisisatest</SUBMITTER_ID>
//    </IDENTIFIERS>
//    <EXPERIMENT_REF accession="ERX000536" refname="PssB728a_assembly" refcenter="JIC">
//      <IDENTIFIERS>
//        <SUBMITTER_ID namespace="JIC">PssB728a_assembly</SUBMITTER_ID>
//      </IDENTIFIERS>
//    </EXPERIMENT_REF>
//    <DATA_BLOCK>
//      <FILES>
//        <FILE filename="test.fastq.gz" filetype="fastq" quality_scoring_system="log-odds" ascii_offset="@" quality_encoding="ascii" checksum="ee9e99f9277bc98c74ec63efa107c58d" checksum_method="MD5"/>
//      </FILES>
//    </DATA_BLOCK>
//    <RUN_ATTRIBUTES>
//      <RUN_ATTRIBUTE>
//        <TAG>run</TAG>
//        <VALUE>1</VALUE>
//      </RUN_ATTRIBUTE>
//      <RUN_ATTRIBUTE>
//        <TAG>total_bases</TAG>
//        <VALUE>255681576</VALUE>
//        <UNITS>bp</UNITS>
//      </RUN_ATTRIBUTE>
//      <RUN_ATTRIBUTE>
//        <TAG>actual_read_length</TAG>
//        <VALUE>72</VALUE>
//      </RUN_ATTRIBUTE>
//    </RUN_ATTRIBUTES>
//  </RUN>
//</RUN_SET>

//Experiment

//<?xml version="1.0" encoding="UTF-8"?>
//<EXPERIMENT_SET>
//  <EXPERIMENT alias="thisisatest" center_name="JIC">
//    <IDENTIFIERS>
//      <SUBMITTER_ID namespace="JIC">thisisatest</SUBMITTER_ID>
//    </IDENTIFIERS>
//    <STUDY_REF refname="thisisatest" refcenter="JIC">
//      <IDENTIFIERS>
//        <SUBMITTER_ID namespace="JIC">thisisatest</SUBMITTER_ID>
//      </IDENTIFIERS>
//    </STUDY_REF>
//    <DESIGN>
//      <DESIGN_DESCRIPTION>Solexa sequencing of Pseudomonas syringae pathovar syringae B728a</DESIGN_DESCRIPTION>
//      <SAMPLE_DESCRIPTOR refname="thisisatest" refcenter="JIC">
//        <IDENTIFIERS>
//          <SUBMITTER_ID namespace="JIC">thisisatest</SUBMITTER_ID>
//        </IDENTIFIERS>
//      </SAMPLE_DESCRIPTOR>
//      <LIBRARY_DESCRIPTOR>
//        <LIBRARY_NAME>PssB728a</LIBRARY_NAME>
//        <LIBRARY_STRATEGY>WGS</LIBRARY_STRATEGY>
//        <LIBRARY_SOURCE>GENOMIC</LIBRARY_SOURCE>
//        <LIBRARY_SELECTION>RANDOM</LIBRARY_SELECTION>
//        <LIBRARY_LAYOUT>
//          <PAIRED NOMINAL_LENGTH="500" NOMINAL_SDEV="0.0"/>
//        </LIBRARY_LAYOUT>
//        <LIBRARY_CONSTRUCTION_PROTOCOL>Standard Solexa protocol</LIBRARY_CONSTRUCTION_PROTOCOL>
//      </LIBRARY_DESCRIPTOR>
//      <SPOT_DESCRIPTOR>
//        <SPOT_DECODE_SPEC>
//          <SPOT_LENGTH>72</SPOT_LENGTH>
//          <READ_SPEC>
//            <READ_INDEX>0</READ_INDEX>
//            <READ_CLASS>Application Read</READ_CLASS>
//            <READ_TYPE>Forward</READ_TYPE>
//            <BASE_COORD>1</BASE_COORD>
//          </READ_SPEC>
//          <READ_SPEC>
//            <READ_INDEX>1</READ_INDEX>
//            <READ_CLASS>Application Read</READ_CLASS>
//            <READ_TYPE>Reverse</READ_TYPE>
//            <BASE_COORD>37</BASE_COORD>
//          </READ_SPEC>
//        </SPOT_DECODE_SPEC>
//      </SPOT_DESCRIPTOR>
//    </DESIGN>
//    <PLATFORM>
//      <ILLUMINA>
//        <INSTRUMENT_MODEL>Illumina Genome Analyzer</INSTRUMENT_MODEL>
//      </ILLUMINA>
//    </PLATFORM>
//    <PROCESSING/>
//    <EXPERIMENT_ATTRIBUTES>
//      <EXPERIMENT_ATTRIBUTE>
//        <TAG>expected_number_bases</TAG>
//        <VALUE>255</VALUE>
//        <UNITS>MB</UNITS>
//      </EXPERIMENT_ATTRIBUTE>
//      <EXPERIMENT_ATTRIBUTE>
//        <TAG>center_name</TAG>
//        <VALUE>The Sainsbury Laboratory</VALUE>
//      </EXPERIMENT_ATTRIBUTE>
//    </EXPERIMENT_ATTRIBUTES>
//  </EXPERIMENT>
//</EXPERIMENT_SET>


