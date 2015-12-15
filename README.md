# Data Hog
> TSL read storage system
<img align="right" height="300" src="https://raw.githubusercontent.com/TeamMacLean/dataHog/master/public/img/datahog.png">

[![Build Status](https://travis-ci.org/TeamMacLean/dataHog.svg)](https://travis-ci.org/TeamMacLean/dataHog)
[![Code Climate](https://codeclimate.com/github/TeamMacLean/dataHog/badges/gpa.svg)](https://codeclimate.com/github/TeamMacLean/dataHog)

## About
Data Hog is a project better manage read data at [TSL](http://tsl.ac.uk). Data Hog also handles the auto uploading of read data to [ENA](https://www.ebi.ac.uk/ena/).

## Dependencies
* [RethinkDB](https://www.rethinkdb.com/)
* [NodeJS](https://nodejs.org)
* [Bower](http://bower.io/)
* [FastQC](http://www.bioinformatics.babraham.ac.uk/projects/fastqc/)

## Install
```
npm install
bower install
```

Copy `config-example.json` to `config.json` and edit it to taste.

## Start
### Start in development:
```
npm install -g nodemon
nodemon server.js
```

#### Start in production:
```
npm install -g pm2
pm2 start --name datahog server.js
```

## Import Legacy
* Stop the web server
* Delete the database
* Restart the databse

...not decided on the rest yet...

* Run `node lib/importLegacy.js`
* Start the web server


