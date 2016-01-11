var nodeSchedule = require('node-schedule');

var Schedule = require('../models/schedule');

var cron = {};
/**
 *
 * @param time Date
 * @param func function
 * @returns {*}
 */
// new Date(2012, 11, 21, 5, 30, 0);
cron.add = function (time, func) {
  return nodeSchedule.scheduleJob(time, func);
};

cron.loadFromDB = function () {

  console.log('loading cron jobs');

  Schedule.run().then(function (schedules) {

    console.log(schedules.length + ' cron jobs found');

    var now = new Date();
    schedules.map(function (s) {
      if (compareDates(s.date, now)) {
        // s.code()
      } else {
        // do nothing?
      }
    });
  });
};

function compareDates(date1, date2) {
  return new Date(date1).getDate() > new Date(date2).getDate();
}

module.exports = cron;