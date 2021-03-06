'use strict';

function fileUploader(mountNode, MD5S, fileID, MD5ID) {


    var CHUNK_SIZE = 102400;

    var socket = io(window.location.host);
    var Files = {};

    function generateUUID() {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
        });
    }

    var App = React.createClass({
        displayName: 'App',

        getInitialState: function getInitialState() {
            return {inputGroups: [], acceptedTypes: [], paired: false, min: 1, max: 100, disabled: false};
        },
        reachMinItems: function reachMinItems() {
            while (this.state.inputGroups.length < out.state.min) {
                this.addInputButton();
            }
            return this;
        },
        setPaired: function setPaired(option) {
            this.setState({paired: option});
            return this;
        },
        setPacBio: function setPacBio(option) { //TODO
            this.setState({pacBio: option, paired: !option});
            return this;
        },
        setMin: function setMin(min) {
            this.setState({min: min});
            this.reachMinItems();
            return this;
        },
        setMax: function (max) {
            this.setState({max: max});
            return this;
        },
        setAcceptedTypes: function setAcceptedTypes(types) {
            this.setState({acceptedTypes: types});
            return this;
        },
        addInputButton: function addInputButton(e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            var cnt = this.state.inputGroups.length;

            var guuid = generateUUID();

            this.setState({
                inputGroups: this.state.inputGroups.concat([{
                    key: guuid,
                    guuid: guuid,
                    index: cnt
                }])
            });
        },
        disable: function disable() {
            this.setState({disabled: true});
        },
        removeGroup: function removeGroup(group, event) {

            event.preventDefault();

            // console.log('called, removeGroup');
            // console.log('files', Files);


            for (var key in Files) {
                if (Files[key].guuid == group.props.guuid) {
                    socket.emit('Stop', key);
                    delete Files[group.props.guuid];
                }
            }

            if (this.state.inputGroups.length > this.state.min && this.state.inputGroups.length < this.state.max + 1) {

                this.setState({
                    inputGroups: this.state.inputGroups.filter(function (g, _) {
                        return g.index !== group.props.index;
                    })
                });
            } else {
                alert('Must be at least ' + this.state.min + ' items, and less than ' + this.state.max + 1);
            }
        },
        render: function render() {
            var self = this;

            if (!self.state.disabled) {


                var groups = self.state.inputGroups.map(function (ig) {
                    return React.createElement(InputGroup, {
                        paired: self.state.paired, guuid: ig.guuid, index: ig.index, key: ig.key,
                        acceptedTypes: self.state.acceptedTypes, removeGroup: self.removeGroup
                    });
                });

                return React.createElement(
                    'div',
                    null,
                    groups,
                    React.createElement(
                        'button',
                        {className: 'button primary thin', onClick: self.addInputButton},
                        'ADD ANOTHER'
                    )
                );
            } else {
                return React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'p',
                        {className: 'disabled'},
                        'DISABLED'
                    )
                );
            }
        }
    });

    var InputGroup = React.createClass({
        displayName: 'InputGroup',

        render: function render() {
            var self = this;
            var inputs = [];

            if (this.props.paired) {
                inputs.push(React.createElement(InputItem, {
                    type: 1, groupIndex: self.props.index, acceptedTypes: self.props.acceptedTypes,
                    guuid: self.props.guuid
                }));
                inputs.push(React.createElement('hr', null));
                inputs.push(React.createElement(InputItem, {
                    type: 2, groupIndex: self.props.index, acceptedTypes: self.props.acceptedTypes,
                    guuid: self.props.guuid
                }));
            } else {
                inputs.push(React.createElement(InputItem, {
                    type: 0, groupIndex: self.props.index, acceptedTypes: self.props.acceptedTypes,
                    guuid: self.props.guuid
                }));
            }
            return React.createElement(
                'div',
                null,
                React.createElement(
                    'div',
                    {className: 'file-group'},
                    inputs,
                    React.createElement(
                        'button',
                        {className: 'error thin', onClick: self.props.removeGroup.bind(this, self)},
                        'REMOVE'
                    ),
                    React.createElement('br', null)
                ),
                React.createElement('br', null)
            );
        }
    });


    var InputItem = React.createClass({
        displayName: 'InputItem',

        socketUpload: function socketUpload(inputItem, event) {

            var input = event.target;
            var $input = $(input);

            if (input.files.length) {

                var uuid = generateUUID();

                Files[uuid] = input.files[0];
                Files[uuid].guuid = inputItem.props.guuid;
                Files[uuid].input = input;
                Files[uuid].meter = $input.parent().find('.meter');
                Files[uuid].meter.show();
                Files[uuid].reader = new FileReader();
                Files[uuid].percent = 0;
                Files[uuid].speed = '';
                Files[uuid].complete = false;

                Files[uuid].reader.onloadend = function (evnt) {

                    if (Files[uuid]) {
                        socket.emit('Upload', {'Name': Files[uuid].name, Data: evnt.target.result, 'UUID': uuid});
                    } else {
                        console.log('looks like file', uuid, 'has been removed'); //todo notify user of issue
                    }


                };

                //TODO lock the submit button
                $('button[type=submit]').prop('disabled', true);

                socket.emit('Start', {
                    'Name': Files[uuid].name,
                    'Size': Files[uuid].size,
                    'Dir': window.location.pathname,
                    'UUID': uuid
                });
            } else {
                console.log('no file in input');

                var meter = $input.parent().find('.meter');

                UpdateBar(meter, 0, '');
                meter.hide();
            }
        },
        render: function render() {

            var self = this;
            var pairNumber = '';
            var label = '';
            var toolTip = '';
            var type = self.props.type;

            if (type && type > 0) {

                toolTip = React.createElement(
                    'span',
                    null,
                    'Please upload your read file here. If you have paired end data, please choose the file that contains the forward reads (usually having "R1" in the filename).'
                );
                if (type === 1) {
                    label = React.createElement(
                        'label',
                        null,
                        'First read file (R1)'
                    );
                } else if (type === 2) {
                    toolTip = React.createElement(
                        'span',
                        null,
                        'Please upload your read file here. Choose the file that contains the reverse reads (usually having "R2" in the filename).'
                    );
                    label = React.createElement(
                        'label',
                        null,
                        'Second read file (R2)'
                    );
                }
                pairNumber = '-' + type;
            }

            var md5 = null;

            var ind = '-' + self.props.groupIndex + pairNumber;

            if (MD5S) {
                md5 = React.createElement(
                    'div',
                    null,
                    React.createElement('br', null),
                    React.createElement(
                        'label',
                        null,
                        'MD5'
                    ),
                    React.createElement(
                        'span',
                        null,
                        'The digital "fingerprint" of your file. Should be in the documents that you got from your sequencing provider.'
                    ),
                    React.createElement('input', {
                        type: 'text',
                        id: MD5ID + ind,
                        name: MD5ID + ind,
                        key: MD5ID + ind,
                        required: true
                    }),
                    React.createElement('br', null)
                );
            }
            return React.createElement(
                'div',
                null,
                React.createElement(
                    'label',
                    null,
                    label
                ),
                React.createElement(
                    'span',
                    null,
                    toolTip
                ),
                React.createElement('input', {
                    type: 'file', id: fileID + ind, accept: self.props.acceptedTypes,
                    onChange: self.socketUpload.bind(self, this),
                    'data-input-name': fileID + ind, required: true
                }),
                React.createElement('input', {type: 'hidden', id: fileID + ind, key: fileID + ind, name: fileID + ind}),
                React.createElement('br', null),
                md5,
                React.createElement(
                    'div',
                    {className: 'meter hidden'},
                    React.createElement(
                        'span',
                        {className: 'bar'}
                    ),
                    React.createElement(
                        'span',
                        {className: 'value'},
                        '0%'
                    )
                ),
                React.createElement('br', null)
            );
        }
    });

    ///SOCKET STUFF

    socket.on('STOPPED', function (info) {
        alert(info);
    });

    socket.on('FAIL', function (err) {
        alert(err);
    });

    socket.on('Complete', function (data) {
        console.log('complete');
        Files[data.UUID].percent = 100;
        Files[data.UUID].complete = true;
        UpdateBar(Files[data.UUID].meter, 100, '');

        var input = $(Files[data.UUID].input);
        var nmval = input.data('input-name');
        var name = 'file' + nmval.substring(nmval.indexOf('-'));

        //remove any existing hidden fields, encase of a replaced file
        var hiddenInput = input.parent().find('input[type=hidden]');

        hiddenInput.val(data.UUID);

        var allUploaded = true;
        for (var key in Files) {
            var f = Files[key];
            if (f.percent && f.percent < 100) {
                allUploaded = false;
            }
        }
        if (allUploaded) {
            $('button[type=submit]').prop('disabled', false);
        }
    });

    socket.on('MoreData', function (data) {
        var File = Files[data.UUID];

        if (File) {
            var timeNow = new Date();
            if (File.lastTime) {
                var difference = timeNow.getTime() - File.lastTime.getTime();
                var seconds = Math.floor(difference * 1000);
                var scale = 1 / seconds;
                var scaledSize = CHUNK_SIZE * scale;

                // File.speeds.push()
                File.speed = scaledSize.toFixed(2)
            }


            File.percent = data.Percent;
            UpdateBar(File.meter, File.percent, File.speed);
            var Place = data['Place'] * CHUNK_SIZE; //The Next Blocks Starting Position
            var NewFile; //The Variable that will hold the new Block of Data
            if (File.slice) {
                NewFile = File.slice(Place, Math.min(Place + CHUNK_SIZE, File.size));
            } else if (File.webkitSlice) {
                NewFile = File.slice(Place, Math.min(Place + CHUNK_SIZE, File.size));
            } else if (File.mozSlice) {
                NewFile = File.slice(Place, Math.min(Place + CHUNK_SIZE, File.size));
            } else {
                alert('Sorry but your browser does not support this');
            }
            File.reader.readAsBinaryString(NewFile);
            File.lastTime = timeNow;
        } else {
            console.log('this file', data.UUID, 'no longer exists');
        }


    });

    function reset() {
        Files = {};
        socket.emit('reset');
    }

    function UpdateBar(bar, percent, speed) {
        bar.find('.bar').width(percent + '%');

        var speedText = speed ? ' at ' + speed + 'MB/s' : '';

        bar.find('.value').text(Math.round(percent) + '%' + speedText);
    }

    var out = ReactDOM.render(React.createElement(App, null), mountNode);

    out.reachMinItems();
    return out;
}