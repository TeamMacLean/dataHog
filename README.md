# Data Hog
> TSL read storage system
<img align="right" height="300" src="https://raw.githubusercontent.com/TeamMacLean/dataHog/master/public/img/datahog.png">

[![Build Status](https://travis-ci.org/TeamMacLean/dataHog.svg)](https://travis-ci.org/TeamMacLean/dataHog)
[![Code Climate](https://codeclimate.com/github/TeamMacLean/dataHog/badges/gpa.svg)](https://codeclimate.com/github/TeamMacLean/dataHog)
[![Coverage Status](https://coveralls.io/repos/TeamMacLean/dataHog/badge.svg?branch=master&service=github)](https://coveralls.io/github/TeamMacLean/dataHog?branch=master)

## Dependencies
* [RethinkDB](https://www.rethinkdb.com/)
* [NodeJS](https://nodejs.org)
* [Bower](http://bower.io/)
* [FastQC](http://www.bioinformatics.babraham.ac.uk/projects/fastqc/)

## Install

```
npm install
npm install -g bower
bower install
```

Start in development:
```
npm install -g nodemon
nodemon server.js
```

Start in production:
```
npm install -g pm2
pm2 start --name datahog server.js
```

