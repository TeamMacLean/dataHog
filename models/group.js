"use strict";

const thinky = require('../lib/thinky.js');
const type = thinky.type;
const util = require('../lib/util');
const config = require('../config.json');

const Group = thinky.createModel('Group', {
    id: type.string(),
    name: type.string().required(),
    safeName: type.string().required(),
    path: type.string().required()
});

Group.define("hpcPath", function () {
    if (config.hpcRoot) {
        return config.hpcRoot + this.path;
    } else {
        return this.path;
    }
});

Group.pre('save', function (next) {
    const group = this;

    console.log(group.name);

    const unsafeName = group.name.name ? group.name.name : group.name;
    if (!group.safeName) {
        Group.run().then(function (result) {

            console.log('creating safeName for', unsafeName);

            util.generateSafeName(unsafeName, result, function (name) {
                group.safeName = name;

                group.path = '/' + group.safeName;

                util.generateUniqueName(group.name, result, function (newName) {
                    group.name = newName;
                    next();
                });
            });
        });
    }
});

module.exports = Group;

const Project = require('./project.js');
Group.hasMany(Project, 'projects', 'id', 'groupID');