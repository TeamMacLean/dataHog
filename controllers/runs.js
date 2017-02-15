"use strict";

const Sample = require('../models/sample');
const Run = require('../models/run');
const Read = require('../models/read');
const Upload = require('../models/upload');
const fs = require('fs-extra');
const path = require('path');
const fastqc = require('../lib/fastqc');
const zlib = require('zlib');
const rimraf = require('rimraf');
const config = require('../config.json');
const util = require('../lib/util');
const thinky = require('../lib/thinky');
const async = require('async');
const email = require('../lib/email');
const Submission = require('../models/submission');
const renderError = require('../lib/error');


const Runs = {};

function deleteRun(run, cb) {

    if (run) {

        Run.get(run.id).getJoin({reads: true}).run().then(function (result) {

            Read.filter({runID: result.id}).run().then(function (reads) {
                reads.map(function (map) {
                    map.delete().then(function () {
                        console.warn('deleted read');
                    });
                });
            });
            result.delete().then(function () {

                const absPath = path.resolve(path.join(config.dataDir, run.path));

                //TODO safety check this!!!
                rimraf(absPath, function (err) {
                    if (err) {
                        console.error(err);
                        return cb(err);
                    } else {
                        console.warn('deleted run folder', absPath);
                        return cb();
                    }
                });
            });
        });
    } else {
        cb(new Error('you did not give me a run!'));
    }
}

/**
 * render the new run form
 * @param req {request}
 * @param res {response}
 */
Runs.new = function (req, res) {

    const groupSN = req.params.group;
    const sampleSN = req.params.sample;
    const projectSN = req.params.project;

    Sample.filter({safeName: sampleSN}).getJoin({project: {group: true}}).filter({
        project: {
            safeName: projectSN,
            group: {safeName: groupSN}
        }
    }).run().then(function (results) {

        if (results.length > 1) {
            console.error('too many samples', results);
        }

        return res.render('runs/new', {sample: results[0]});
    }).error(function (err) {
        return renderError(err, res)
    });
};

/**
 * compress a file
 * @param filename {filename}
 * @param callback {function}
 */
function compressFile(filename, callback) {

    const compressedPath = filename + '.gz';

    const compress = zlib.createGzip(),
        input = fs.createReadStream(filename),
        output = fs.createWriteStream(compressedPath);

    input.pipe(compress).pipe(output);

    if (callback) {


        output.on('finish', function () {
            callback(compressedPath);
        });
    }
}


function isCompressed(str) {

    console.log('checking compression', str);

    if (str.toLowerCase().indexOf('.bzip2') > -1) {
        return true;
    }
    else if (str.toLowerCase().indexOf('.bz2') > -1) {
        return true
    } else if (str.toLowerCase().indexOf('.gzip') > -1) {
        return true;
    }
    else return str.toLowerCase().indexOf('.gz') > -1;
}

/**
 *
 * @param fileAndMD5
 * @param cb
 * @returns {*}
 */
function ensureCompressed(fileAndMD5, cb) {

    //const file = fileAndMD5.file;
    const md5er = fileAndMD5.md5;

    // const fileBuff = readFileSync(fileAndMD5.path); //TODO breaking point

    const compressed = isCompressed(fileAndMD5.name);
    const fileExtention = path.extname(fileAndMD5.name);

    const name = fileAndMD5.name;

    if (!compressed && ['.fq', '.fastq'].indexOf(fileExtention) < 0) {
        const err = new Error('not compressed and not a fastq/fq file extention');
        return cb(err);

    } else if (!compressed) { //not compressed
        compressFile(fileAndMD5.path, function (compressedPath) {

            util.md5Stream(fileAndMD5.path, function (md5) {

                return cb(null, {md5: md5, path: path.resolve(compressedPath), name: name + '.gz'});
            });
        });
    } else { //is compressed already
        return cb(null, {md5: md5er, path: path.resolve(fileAndMD5.path), name: name});
    }
}


/**
 *
 * @param req {request} request
 * @param cb {function} callback
 */
function processAllFiles(req, cb) {

    const filesAndSums = [];
    const additionalFiles = [];
    //const __filesAndSums = [];
    //const __additionalFiles = [];
    const absTmpPath = path.resolve(config.tmpDir);


    async.eachSeries(Object.keys(req.body), function iterator(key, theNextOne) {

        const val = req.body[key];
        const filePath = path.join(absTmpPath, val);

        if (key.indexOf('file') > -1) {
            const split = val.split('-');
            if (split.length === 3) {
                console.log('its paired');
            } else {
                console.log('its not paired');
            }

            const num = key.substring(key.indexOf('-') + 1);

            const md5Lookup = 'md5-' + num;


            Upload.filter({uuid: val}).run().then(function (foundFS) {
                const f = foundFS[0];
                filesAndSums.push({
                    name: f.name,
                    uuid: f.uuid,
                    path: filePath,
                    md5: req.body[md5Lookup].trim(),
                    fieldname: key
                });
                theNextOne();
            })

        } else if (key.indexOf('additional') > -1) {
            Upload.filter({uuid: val}).run().then(function (foundAF) {
                const a = foundAF[0];
                additionalFiles.push({
                    name: a.name,
                    uuid: a.uuid,
                    path: filePath,
                    fieldname: key
                });
                //console.log('additional', additionalFiles);
                theNextOne();
            })
        } else {
            theNextOne();
        }
    }, function done(err) {

        if (err) {
            console.error(err);
        }

        //console.log('calling back', filesAndSums, additionalFiles);

        cb(filesAndSums, additionalFiles);
    });
}

/**
 *
 * @param req {request}
 * @param processed {boolean}
 * @param savedRun {run}
 * @param pathToNewRunFolder
 * @param cb {function}
 */
function addReadToRun(req, processed, savedRun, pathToNewRunFolder, cb) {
    const rootPath = pathToNewRunFolder;

    if (processed) {
        pathToNewRunFolder = path.join(pathToNewRunFolder, 'processed');
    } else {
        pathToNewRunFolder = path.join(pathToNewRunFolder, 'raw');
    }

    fs.ensureDir(pathToNewRunFolder, function (err) {
        if (err) {
            console.error(err);
            cb(err);
        } else {
            const savedReads = [];

            processAllFiles(req, function (filesAndSums, additionalFiles) {

                if (additionalFiles.length > 0) {
                    console.log('processing additional');
                    util.addAdditional(savedRun, additionalFiles, rootPath, function (err) {
                        if (err) {
                            console.error(err);
                        }
                    });
                }

                const happyFiles = [];
                const sadFiles = [];

                //TODO just changed this to process one md5 at a time
                async.eachSeries(filesAndSums, function iterator(fsum, hhnext) {

                    //TODO after this async process
                    util.md5Stream(fsum.path, function (sum) {
                        if (sum === fsum.md5) {
                            happyFiles.push(fsum);
                        } else {
                            console.error('MD5 ERROR', 'in:', fsum.md5, 'got:', sum, 'length test:', fsum.md5.length, sum.length);
                            sadFiles.push(fsum);
                        }
                        hhnext();
                    });


                }, function done(err) {
                    //cb(err); //IMPORTANT after all reads, run and fastaqc created!

                    if (err) {
                        cb(err);
                    }

                    if (sadFiles.length > 0) {

                        sadFiles.map(function (sdd) {
                            console.log(sdd);
                        });


                        return cb(new Error('md5 sums do not match'));
                    }

                    if (happyFiles.length < 1) {
                        //TODO
                        //return cb(new Error('no read files attached'));
                    }

                    const usedFileNames = [];
                    let previousID = '';
                    async.eachSeries(happyFiles, function iterator(fileAndMD5, nextHappyFile) {

                        //const file = fileAndMD5.path;

                        let fileName = fileAndMD5.name;
                        let testName = fileAndMD5.name;

                        let exts = '';

                        if (testName.indexOf('.') > -1) {

                            const preSplit = testName;

                            testName = preSplit.substr(0, preSplit.indexOf('.'));
                            exts = preSplit.substr(preSplit.indexOf('.'));
                        }

                        if (usedFileNames.indexOf(testName) > -1) {
                            let i = 0;
                            while (usedFileNames.indexOf(testName) > -1) {
                                i++;
                                testName = testName + i;
                            }
                            fileName = testName + exts;
                        }
                        usedFileNames.push(testName);
                        fileAndMD5.name = fileName;

                        ensureCompressed(fileAndMD5, function (topError, md5AndPath) {

                            if (topError) {
                                return cb(topError);
                            }

                            let newFullPath = path.join(pathToNewRunFolder, md5AndPath.name);

                            util.safeMove(md5AndPath.path, newFullPath, function (err, newPath) {

                                if (err) {
                                    cb(err);
                                }

                                if (newPath) { //it may have found a new name!
                                    newFullPath = newPath;
                                }
                                const fqcPath = path.join(pathToNewRunFolder, '.fastqc');

                                let siblingID = null;
                                const split = fileAndMD5.fieldname.split('-');
                                if (split.length === 3) { //its paired/mated

                                    const second = split[2] === '2';
                                    if (second) {
                                        siblingID = previousID;
                                    }
                                }

                                fs.ensureDir(fqcPath, function (err) { // create fastqc folder
                                    if (err) {
                                        console.error(err);
                                        return cb(err);
                                    } else {

                                        const fileName = path.basename(newPath);
                                        const read = new Read({
                                            name: md5AndPath.name,
                                            runID: savedRun.id,
                                            MD5: md5AndPath.md5,
                                            processed: processed,
                                            siblingID: siblingID,
                                            fileName: fileName
                                        });


                                        //TODO FIXME fastqc.run(newFullPath, fqcPath, function () {
                                        console.log('created fastqc report');
                                        //read.fastQCLocation = fqcPath;
                                        read.save().then(function (savedRead) {
                                            previousID = read.id;
                                            savedReads.push(savedRead);
                                            return nextHappyFile(); //IMPORTANT!!

                                        }).error(function (err) {
                                            if (err) {
                                                return cb(err);
                                            }
                                        });
                                        //});
                                    }
                                });
                            });
                        });
                    }, function done(err) {
                        cb(err); //IMPORTANT after all reads, run and fastaqc created!
                    });
                });
            });
        }
    });
}


/**
 * post new run
 * @param req {request}
 * @param res {response}
 */
Runs.newPost = function (req, res) {

    const projectSN = req.params.project;
    const sampleSN = req.params.sample;
    const groupSN = req.params.group;
    const name = req.body.name;

    const sequencingProvider = req.body.sequencingProvider;
    const sequencingTechnology = req.body.sequencingTechnology;
    const insertSize = req.body.insertSize;
    const libraryType = req.body.libraryType;
    const submissionToGalaxy = req.body.submissionToGalaxy === 'on';

    const librarySource = req.body.librarySource;
    const librarySelection = req.body.librarySelection;
    const libraryStrategy = req.body.libraryStrategy;


    Sample.filter({safeName: sampleSN}).getJoin({project: {group: true}}).filter({
        project: {
            safeName: projectSN,
            group: {safeName: groupSN}
        }
    }).run().then(function (results) {
        if (results.length > 1) {
            console.error('too many samples', results);
        }
        const sample = results[0];

        const run = new Run({
            name: name,
            sampleID: sample.id,
            librarySource: librarySource,
            librarySelection: librarySelection,
            libraryStrategy: libraryStrategy,
            sequencingProvider: sequencingProvider,
            sequencingTechnology: sequencingTechnology,
            insertSize: insertSize,
            submissionToGalaxy: submissionToGalaxy,
            libraryType: libraryType
        });


        run.save().then(function (savedRun) {

            const pathToNewRunFolder = path.join(config.dataDir, sample.project.group.safeName, sample.project.safeName, sample.safeName, savedRun.safeName);

            fs.ensureDir(path.join(pathToNewRunFolder, 'processed'), function (err) { //make sure the processed folder exists
                if (err) {
                    return renderError(err, res)
                }
                fs.ensureDir(path.join(pathToNewRunFolder, 'raw'), function (err) { //make sure the raw folder exists
                    if (err) {
                        return renderError(err, res)
                    }

                    const processed = false;
                    //TODO disabled for now

                    addReadToRun(req, processed, savedRun, pathToNewRunFolder, function (err) {

                        if (err) {
                            console.error(err);
                            deleteRun(savedRun, function () {
                                return renderError(err, res)
                            });
                        } else {

                            if (submissionToGalaxy) {

                                //const project = savedRun.sample.project;

                                //const p1 = project.responsiblePerson;
                                //const p2 = project.secondaryContact;

                                const hpcPath = path.join(config.hpcRoot, savedRun.path);
                                const siteURL = req.protocol + '://' + req.headers.host + savedRun.path;

                                const subject = "Request for data to be added to Galaxy";
                                const text = "Please add " + hpcPath + " to Galaxy.\n\n" + siteURL + "\n\nThanks :D\nDataHog";
                                email.emailAdmin(subject, text);
                            }

                            return renderOK();
                        }

                    });
                });
            });

            //renderOK();

            function renderOK() {
                Run.get(savedRun.id).getJoin({
                    sample: {project: {group: true}},
                    reads: true
                }).then(function (result) {

                    const thisGroupConfig = config.groups.filter(function (g) {
                        return g.name == result.sample.project.group.name;
                    });

                    if (thisGroupConfig.length > 0) {
                        if (thisGroupConfig[0].sendToENA) {
                            const submission = new Submission({
                                runID: result.id
                            });
                            submission.save();

                            submission.submit();
                        }
                    }

                    const url = path.join('/', result.sample.project.group.safeName, result.sample.project.safeName, result.sample.safeName, result.safeName);
                    return res.redirect(url);
                });
            }

        });
    });
};


/**
 * render one run
 * @param req {request}
 * @param res {response}
 */
Runs.show = function (req, res) {
    const runSN = req.params.run;
    const sampleSN = req.params.sample;
    const projectSN = req.params.project;
    const groupSN = req.params.group;

    Run.filter({safeName: runSN}).getJoin({
        sample: {project: {group: true}},
        reads: {sibling: true},
        additionalFiles: true
    }).filter({
        sample: {
            safeName: sampleSN,
            project: {
                safeName: projectSN,
                group: {safeName: groupSN}
            }
        }
    }).then(function (results) {


        if (results.length === 0) {
            return renderError(new Error('Count not find run ' + runSN), res);
        }

        if (results.length > 1) {
            console.error('too many runs!', results);
        }

        const run = results[0];

        run.reads.sort(function (a, b) {
            const nameA = a.safeName.toLowerCase(), nameB = b.safeName.toLowerCase();
            if (nameA < nameB) //sort string ascending
                return -1;
            if (nameA > nameB)
                return 1;
            return 0; //default return value (no sorting)
        });

        const raw = [];
        const processed = [];

        if (run.reads && run.reads.length > 0) {
            const rawPRE = run.reads.filter(function (r) {
                return r.processed === false;
            });

            const processedPRE = run.reads.filter(function (r) {
                return r.processed === true;
            });


            const disposedRaw = [];
            rawPRE.map(function (r) {
                if (disposedRaw.filter(function (d) {
                        if (r.sibling) {
                            return d.id == r.sibling.id
                        } else {
                            return d.id == r.id
                        }
                    }).length < 1) {
                    if (r.sibling) {
                        disposedRaw.push(r);
                        disposedRaw.push(r.sibling);
                        raw.push([r, r.sibling]);
                    } else {
                        disposedRaw.push(r);
                        raw.push([r]);
                    }
                }
            });

            const disposedProcessed = [];
            processedPRE.map(function (r) {
                if (disposedProcessed.filter(function (d) {
                        if (r.sibling) {
                            return d.id == r.sibling.id
                        } else {
                            return d.id == r.id
                        }
                    }).length < 1) {
                    if (r.sibling) {
                        disposedProcessed.push(r);
                        disposedProcessed.push(r.sibling);
                        processed.push([r, r.sibling]);
                    } else {
                        disposedProcessed.push(r);
                        processed.push([r]);
                    }
                }
            });
        }


        const unknownRaw = [];
        const unknownProcessed = [];

        const rawPath = path.join(config.dataDir, run.path, 'raw');
        const processedPath = path.join(config.dataDir, run.path, 'processed');

        try {
            fs.ensureDirSync(rawPath);

            let rawFiles = fs.readdirSync(rawPath);
            rawFiles = rawFiles.filter(function (rfilter) {
                return rfilter != '.fastqc' && rfilter.indexOf('.txt') < 0;
            });

            rawFiles.map(function (rf) {
                let found = false;
                raw.map(function (r) {
                    if (r.filter(function (rr) {
                            // console.log(rf, rr);
                            return rf.trim().toUpperCase() == rr.name.trim().toUpperCase();
                            // return rf.name.trim().toUpperCase() == rr.trim().toUpperCase();
                        }).length > 0) {
                        found = true;
                    }
                });
                if (!found) {
                    unknownRaw.push(rf);
                }
            });
        } catch (err) {
            return renderError(err, res)
        }

        try {
            fs.ensureDirSync(processedPath);

            let processedFiles = fs.readdirSync(processedPath);
            processedFiles = processedFiles.filter(function (pfilter) {
                return pfilter != '.fastqc' && pfilter.indexOf('.txt') < 0;
            });

            processedFiles.map(function (pf) {
                let found = false;
                processed.map(function (p) {
                    if (p.filter(function (pp) {
                            // console.log(pf, pp);
                            return pf.trim().toUpperCase() == pp.name.trim().toUpperCase();
                            // return pf.name.trim().toUpperCase() == pp.trim().toUpperCase();
                        }).length > 0) {
                        found = true;
                    }
                });
                if (!found) {
                    console.log('UNKNOWN', pf);
                    unknownProcessed.push(pf);
                }
            });
        } catch (err) {
            return renderError(err, res)
        }


        return res.render('runs/show', {
            run: run,
            raw: raw,
            processed: processed,
            unknownRaw: unknownRaw,
            unknownProcessed: unknownProcessed
        });
    }).error(function () {
        return renderError(new Error('cound not find run'), res);
    });
};

/**
 *
 * @param req {request}
 * @param res {response}
 */
Runs.addPost = function (req, res) {

    const runSN = req.params.run;
    const sampleSN = req.params.sample;
    const projectSN = req.params.project;

    Run.filter({safeName: runSN}).getJoin({sample: {project: {group: true}}, reads: true}).filter({
        sample: {
            safeName: sampleSN,
            project: {safeName: projectSN}
        }
    }).then(function (results) {

        if (results.length > 1) {
            console.error('too many runs', results);
        }

        const run = results[0];
        const pathToRunProcessedFolder = path.join(config.dataDir, run.sample.project.group.safeName, run.sample.project.safeName, run.sample.safeName, run.safeName);
        const processed = true;

        //processed!
        addReadToRun(req, processed, run, pathToRunProcessedFolder, function (err) {
            if (err) {
                deleteRun(run, function () {
                    return renderError(new Error('had to delete the run + reads'), res)
                });
            }
            const url = path.join('/', run.sample.project.group.safeName, run.sample.project.safeName, run.sample.safeName, run.safeName);
            return res.redirect(url);
        });

    });
};


module.exports = Runs;
