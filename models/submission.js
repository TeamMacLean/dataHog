"use strict";

var thinky = require('../lib/thinky.js');
var r = thinky.r;
var type = thinky.type;
var js2xmlparser = require('js2xmlparser');
var moment = require('moment');
//var config = require('../config.json');
//var util = require('../lib/util');

var Submission = thinky.createModel('Submission', {
  id: type.string(),
  createdAt: type.date().default(r.now()),
  publishDate: type.date().required(),
  runID: type.string().required()
});

Submission.define("toENA", function () {

  var id = Date.now();
  var holdDate = moment().add(2, 'years').format('YYYY-MM-DD');

  console.log('HOLDING UNTIL', holdDate);

  return `<?xml version="1.0" encoding="UTF-8"?>
<SUBMISSION_SET>
    <SUBMISSION center_name="JIC">
        <IDENTIFIERS>
            <SUBMITTER_ID namespace="JIC">${id}</SUBMITTER_ID>
        </IDENTIFIERS>
        <ACTIONS>
            <ACTION>
                <!--<RELEASE/> will be immediate is this is uncommented-->
                <HOLD HoldUntilDate="${holdDate}"/>
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

module.exports = Submission;