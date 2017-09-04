const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const routes = require('./routes');
const config = require('./config.json');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const util = require('./lib/util');
const socketUploader = require('./lib/socketUploader');
const rethinkSession = require('session-rethinkdb')(session);
const Submission = require('./models/submission');
const schedule = require('node-schedule');
const moment = require('moment');
const email = require('./lib/email');


if (!config.appName || !config.port || !config.dataDir || !config.tmpDir) {
    console.error('please fill out config.json');
    process.exit(1);
}


if (!fs.existsSync(config.dataDir)) {
    console.error('dataDir', config.dataDir, 'does not exist');
}


if (!fs.existsSync(config.tmpDir)) {
    console.error('tmpDir', config.tmpDir, 'does not exist');
}

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.locals.title = config.appName;
app.use(express.static(__dirname + '/public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(multer({
    dest: config.tmpDir
}));

const options = {
    servers: [
        {host: 'localhost', port: 28015, db: 'Hog'}
    ]
};

const store = new rethinkSession(options);

app.use(session({
    secret: config.secret,
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    if (req.user) {
        res.locals.signedInUser = {};
        res.locals.signedInUser.username = req.user.username;
        res.locals.signedInUser.name = req.user.name;
        res.locals.signedInUser.mail = req.user.mail;
    }
    next(null, req, res);
});

util.setupPassport();

app.use(routes);

app.use(function (err, req, res, next) {
    if (err) {
        console.error(err);
        return res.status(500).render('error', {error: err});
    } else {
        return next();
    }
});


Submission.getJoin({
    run: {
        sample: {
            project: {
                group: true
            }
        }
    }
}).run().then(function (subs) {
    subs.map(function (s) {
        const now = moment();
        const holdTill = moment(s.holdDate);
        const diffInDays = holdTill.diff(now, 'days');
        console.log(diffInDays, 'days until', s.id, 'is public in ENA');
        const FourWeeks = holdTill.subtract(4, 'weeks');
        const ThreeWeeks = holdTill.subtract(3, 'weeks');
        const TwoWeeks = holdTill.subtract(2, 'weeks');
        const OneWeek = holdTill.subtract(1, 'weeks');
        const TwoDays = holdTill.subtract(2, 'days');
        const OneDay = holdTill.subtract(1, 'days');


        const contacts = [s.run.sample.project.responsiblePerson, s.run.sample.project.secondaryContact];


        config.groups.map(function (g) {

            const ConfigGroupName = g["name"];

            const GroupName = s.run.sample.project.group.name;

            if (ConfigGroupName && GroupName && g["email"]) {
                if (ConfigGroupName.toLowerCase() === GroupName.toLowerCase()) {
                    contacts.push(g["email"])
                }
            }
        });

        schedule.scheduleJob(FourWeeks.toDate(), function () {
            email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 4 weeks, the data being published can be found at ' + s.run.path, contacts)
        });
        schedule.scheduleJob(ThreeWeeks.toDate(), function () {
            email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 3 weeks, the data being published can be found at ' + s.run.path, contacts)
        });
        schedule.scheduleJob(TwoWeeks.toDate(), function () {
            email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 2 weeks, the data being published can be found at ' + s.run.path, contacts)
        });
        schedule.scheduleJob(OneWeek.toDate(), function () {
            email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 1 weeks, the data being published can be found at ' + s.run.path, contacts)
        });
        schedule.scheduleJob(TwoDays.toDate(), function () {
            email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA in 2 days, the data being published can be found at ' + s.run.path, contacts)
        });
        schedule.scheduleJob(OneDay.toDate(), function () {
            email.emailSomeone('Your data will be published on ENA soon', 'Your data will be made public on ENA TOMORROW, the data being published can be found at ' + s.run.path, contacts)
        });
    })
});


socketUploader(io);


module.exports = server;


