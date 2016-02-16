var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('../config.json').email;
var email = {};


/**
 * Send email
 * @param subject {string}
 * @param text {string}
 */
email.emailAdmin = function (subject, text) {

  var transporter = nodemailer.createTransport(smtpTransport({
    host: config.host,
    port: config.port
  }));

  transporter.sendMail({
    from: config.from,
    to: config.galaxyAdmin,
    subject: subject,
    text: text
  }, function (err, info) {
    if (err) {
      console.error(err);
    } else {
      console.log('Message sent:', info.response);
    }
  });
};

email.emailSomeone = function (subject, text, addresses) {
  var transporter = nodemailer.createTransport(smtpTransport({
    host: config.host,
    port: config.port
  }));
  transporter.sendMail({
    from: config.from,
    to: addresses,
    subject: subject,
    text: text
  }, function (err, info) {
    if (err) {
      console.error(err);
    } else {
      console.log('Message sent:', info.response);
    }
  });

};


module.exports = email;