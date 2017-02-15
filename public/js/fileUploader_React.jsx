function fileUploader(mountNode, MD5S, fileID, MD5ID) {

    const socket = io(window.location.host);
    let Files = [];

    function generateUUID() {
        let d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    const App = React.createClass({
        getInitialState: function getInitialState() {
            return {inputGroups: [], acceptedTypes: [], paired: false, pacBio: false, min: 1};
        },
        reachMinItems: function reachMinItems() {
            while (this.state.inputGroups.length < out.state.min) {
                this.addInputButton();
            }
            return this;
        },
        setPaired: function setPaired(option) {
            this.setState({paired: option});
            console.log(this.state.paired);
            return this;
        },
        setPacBio: function setPacBio(option) {
            this.setState({pacBio: option, paired: !option});
            return this;
        },
        setMin: function setMin(min) {
            this.setState({min: min});
            this.reachMinItems();
            return this;
        },
        setAcceptedTypes: function (types) {
            this.setState({acceptedTypes: types});
            return this;
        },
        addInputButton: function addInputButton(e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            const cnt = this.state.inputGroups.length;

            const guuid = generateUUID();

            this.setState({
                inputGroups: this.state.inputGroups.concat([{
                    key: guuid,
                    guuid: guuid,
                    index: cnt
                }])
            });

        },
        removeGroup: function removeGroup(group, event) {

            event.preventDefault();

            Files = Files.filter(function (f) {
                return f.guuid != group.props.guuid;
            });

            delete Files[group.props.guuid];

            if (this.state.inputGroups.length > this.state.min) {

                this.setState({
                    inputGroups: this.state.inputGroups.filter(function (g, _) {
                        return g.index !== group.props.index;
                    })
                });

            } else {
                alert('Must be at least ' + this.state.min + ' items');
            }

        },
        render: function render() {
            const self = this;


            if (this.state.pacBio) {
                return (<PacBioItem/>);
            } else {
                const groups = self.state.inputGroups.map(function (ig) {
                    return <InputGroup paired={self.state.paired} guuid={ig.guuid} index={ig.index} key={ig.key}
                                       acceptedTypes={self.state.acceptedTypes} removeGroup={self.removeGroup}/>
                });
                return (
                    <div>
                        {groups}
                        <button className="button primary thin" onClick={self.addInputButton}>ADD ANOTHER</button>
                    </div>
                )
            }
        }
    });

    let InputGroup = React.createClass({
        render: function render() {
            const self = this;
            const inputs = [];


            if (this.props.paired) {
                inputs.push(<InputItem type={1} groupIndex={self.props.index} acceptedTypes={self.props.acceptedTypes}
                                       guuid={self.props.guuid}/>);
                inputs.push(<hr/>);
                inputs.push(<InputItem type={2} groupIndex={self.props.index} acceptedTypes={self.props.acceptedTypes}
                                       guuid={self.props.guuid}/>)
            } else {
                inputs.push(<InputItem type={0} groupIndex={self.props.index} acceptedTypes={self.props.acceptedTypes}
                                       guuid={self.props.guuid}/>);
            }
            return (
                <div>
                    <div className="file-group">
                        {inputs}
                        <button className="error thin" onClick={self.props.removeGroup.bind(this, self)}>REMOVE</button>
                        <br/>
                    </div>
                    <br/>
                </div>
            )
        }
    });

    let PacBioItem = React.createClass({
        render: function render() {

            const baxAccept = [".bax.h5"];
            const basAccept = [".bas.h5"];
            const metaAccept = [".metadata.xml"];

            return (

                <div>
                    <label>Bax Files</label>
                    <input type="file" required="required" accept={baxAccept}/>
                    <input type="file" required="required" accept={baxAccept}/>
                    <input type="file" required="required" accept={baxAccept}/>

                    <label>Bas File</label>
                    <input type="file" required="required" accept={basAccept}/>

                    <label>Meta Data</label>
                    <input type="file" required="required" accept={metaAccept}/>
                </div>
            )

        }
    });

    let InputItem = React.createClass({

        socketUpload: function socketUpload(inputItem, event) {


            const input = event.target;
            const $input = $(input);

            if (input.files.length) {

                const uuid = generateUUID();

                Files[uuid] = input.files[0];
                Files[uuid].guuid = inputItem.props.guuid;
                Files[uuid].input = input;
                Files[uuid].meter = $input.parent().find('.meter');
                Files[uuid].meter.show();
                Files[uuid].reader = new FileReader();
                Files[uuid].percent = 0;

                Files[uuid].reader.onloadend = function (evnt) {
                    socket.emit('Upload', {'Name': Files[uuid].name, Data: evnt.target.result, 'UUID': uuid});
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

                const meter = $input.parent().find('.meter');

                UpdateBar(meter, 0);
                meter.hide();

            }
        },
        render: function render() {

            const self = this;
            let pairNumber = '';
            let label = '';
            let toolTip = '';
            const type = self.props.type;


            if (type && type > 0) {

                toolTip =
                    <span>Please upload your read file here. If you have paired end data, please choose the file that contains the forward reads (usually having "R1" in the filename).</span>;
                if (type === 1) {
                    label = <label>First read file (R1)</label>
                } else if (type === 2) {
                    toolTip =
                        <span>Please upload your read file here. Choose the file that contains the reverse reads (usually having "R2" in the filename).</span>;
                    label = <label>Second read file (R2)</label>
                }
                pairNumber = '-' + type;
            }

            let md5 = null;

            const ind = '-' + self.props.groupIndex + pairNumber;


            if (MD5S) {
                md5 = (
                    <div>
                        <br/>
                        <label>MD5</label>
                        <span>The digital "fingerprint" of your file. Should be in the documents that you got from your sequencing provider.</span>
                        <input type="text" id={MD5ID + ind} name={MD5ID + ind} key={MD5ID + ind} required/>
                        <br/>
                    </div>
                )
            }
            return (
                <div>
                    <label>{label}</label>
                    <span>{toolTip}</span>
                    <input type="file" id={fileID + ind} accept={self.props.acceptedTypes}
                           onChange={self.socketUpload.bind(self, this)}
                           data-input-name={fileID + ind} required/>
                    <input type="hidden" id={fileID + ind} key={fileID + ind} name={fileID + ind}/>
                    <br/>
                    {md5}
                    <div className="meter hidden">
                        <span>0%</span>
                    </div>
                    <br/>
                </div>
            )
        }
    });


///SOCKET STUFF

    socket.on('Complete', function (data) {
        console.log('complete');
        Files[data.UUID].percent = 100;
        UpdateBar(Files[data.UUID].meter, 100);

        const input = $(Files[data.UUID].input);
        const nmval = input.data('input-name');
        const name = 'file' + nmval.substring(nmval.indexOf('-'));

        //remove any existing hidden fields, encase of a replaced file
        const hiddenInput = input.parent().find('input[type=hidden]');

        hiddenInput.val(data.UUID);

        const incompleteUploads = Files.filter(function (f) {
            return f.percent < 100;
        });

        if (incompleteUploads.length == 0) {
            $('button[type=submit]').prop('disabled', false);
        }

    });

    socket.on('MoreData', function (data) {
        const File = Files[data.UUID];
        Files[data.UUID].percent = data.Percent;
        UpdateBar(File.meter, Files[data.UUID].percent);
        const Place = data['Place'] * 524288; //The Next Blocks Starting Position
        let NewFile; //The Variable that will hold the new Block of Data
        if (File.slice) {
            NewFile = File.slice(Place, Place + Math.min(524288, (File.size - Place)));
        }
        else if (File.webkitSlice) {
            NewFile = File.webkitSlice(Place, Place + Math.min(524288, (File.size - Place)));
        }
        else if (File.mozSlice) {
            NewFile = File.mozSlice(Place, Place + Math.min(524288, (File.size - Place)));
        } else {
            alert('Sorry but your browser does not support this');
        }
        File.reader.readAsBinaryString(NewFile);
    });

    function reset() {
        Files = [];
        socket.emit('reset');
    }

    function UpdateBar(bar, percent) {
        bar
            .find('span')
            .width(percent + '%')
            .text(Math.round(percent) + '%');
    }


    let out = ReactDOM.render(React.createElement(App, null), mountNode);

    out.reachMinItems();
    return out;
}