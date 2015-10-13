# Data Hog

[![Build Status](https://travis-ci.org/TeamMacLean/dataHog.svg)](https://travis-ci.org/TeamMacLean/dataHog)
[![Code Climate](https://codeclimate.com/github/TeamMacLean/dataHog/badges/gpa.svg)](https://codeclimate.com/github/TeamMacLean/dataHog)
[![Coverage Status](https://coveralls.io/repos/TeamMacLean/dataHog/badge.svg?branch=master&service=github)](https://coveralls.io/github/TeamMacLean/dataHog?branch=master)


## Install

```
npm install
npm install -g bower
bower install
```

Optional:
```
npm install -g pm2
npm install -g nodemon
```

Start in development:
```
nodemon server.js
```

Start in production:
```
pm2 start --name datahog server.js
```

