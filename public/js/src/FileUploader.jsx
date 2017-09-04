import React from 'react';
import ReactDOM from 'react-dom';
import util from './util';
import InputGroup from './InputGroup.jsx';
import swal from 'sweetalert2';


const FILE_CHUNK_SIZE = 524288;

window.fileUploader = function fileUploader(mountNode, MD5S, fileID, MD5ID) {

    let Files = [];


    class App extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                inputGroups: [],
                paired: false,
                pacBio: false,
                min: 1
            };
            this.removeGroup = this.removeGroup.bind(this);
            this.addInputButton = this.addInputButton.bind(this);
        }

        componentDidMount(){
            this.setupSocket();
        }

        setupSocket() {
            const socket = io(window.location.host);
            socket.on('Complete', function (data) {
                console.log('complete');
                Files[data.UUID].percent = 100;
                this.updateBar(Files[data.UUID].meter, 100);

                const input = $(Files[data.UUID].input);
                // const nmval = input.data('input-name');
                // const name = 'file' + nmval.substring(nmval.indexOf('-'));

                //remove any existing hidden fields, encase of a replaced file
                const hiddenInput = input.parent().find('input[type=hidden]');

                hiddenInput.val(data.UUID);

                const incompleteUploads = Files.filter(function (f) {
                    return f.percent < 100;
                });

                if (incompleteUploads.length === 0) {
                    $('button[type=submit]').prop('disabled', false);
                }

            });

            socket.on('MoreData', function (data) {
                const File = Files[data.UUID];

                if (File) {
                    Files[data.UUID].percent = data.Percent;
                    this.updateBar(File.meter, Files[data.UUID].percent);
                    const Place = data['Place'] * FILE_CHUNK_SIZE; //The Next Blocks Starting Position
                    let NewFile; //The Variable that will hold the new Block of Data
                    if (File.slice) {
                        NewFile = File.slice(Place, Place + Math.min(FILE_CHUNK_SIZE, (File.size - Place)));
                    }
                    else if (File.webkitSlice) {
                        NewFile = File.webkitSlice(Place, Place + Math.min(FILE_CHUNK_SIZE, (File.size - Place)));
                    }
                    else if (File.mozSlice) {
                        NewFile = File.mozSlice(Place, Place + Math.min(FILE_CHUNK_SIZE, (File.size - Place)));
                    } else {
                        swal('Oops...', 'Sorry but your browser does not support this', 'error')
                    }
                    File.reader.readAsBinaryString(NewFile);
                }
            });
        }

        reset() {
            Files = [];
            this.socket.emit('reset');
        }

        updateBar(bar, percent) {
            bar
                .find('span')
                .width(percent + '%')
                .text(Math.round(percent) + '%');
        }

        reachMinItems() {
            while (this.state.inputGroups.length < out.state.min) {
                this.addInputButton();
            }
            return this;
        }

        setPaired(option) {
            this.setState({paired: option, pacBio: false});
            return this;
        }

        setPacBio(option) {
            this.setState({pacBio: option, paired: false});
            return this;
        }

        setMin(min) {
            this.setState({min: min});
            this.reachMinItems();
            return this;
        }

        // setAcceptedTypes(types) {
        //     this.setState({acceptedTypes: types});
        //     return this;
        // }

        addInputButton(e) {

            if (e && e.preventDefault) {
                e.preventDefault();
            }
            const cnt = this.state.inputGroups.length;

            const guuid = util.generateUUID();

            this.setState({
                inputGroups: this.state.inputGroups.concat([{
                    key: guuid,
                    guuid: guuid,
                    index: cnt
                }])
            });

        }

        removeGroup(event, inputGroup) {

            event.preventDefault();

            Files = Files.filter(function (f) {
                return f.guuid !== this.props.guuid;
            });

            delete Files[this.props.guuid];

            if (this.state.inputGroups.length > this.state.min) {

                this.setState({
                    inputGroups: this.state.inputGroups.filter(function (g) {
                        return g.index !== inputGroup.props.index;
                    })
                });

            } else {
                swal('Oops...', 'Must be at least ' + this.state.min + ' items', 'warning');
            }

        }

        render() {
            const self = this;

            const groups = self.state.inputGroups.map(function (ig) {
                return <InputGroup pacBio={self.state.pacBio} paired={self.state.paired} guuid={ig.guuid}
                                   index={ig.index} key={ig.key}
                                   removeGroup={self.removeGroup} MD5S={MD5S}/>
            });
            return (
                <div>
                    {groups}
                    <button className="button primary thin" onClick={self.addInputButton}>ADD ANOTHER</button>
                </div>
            )

        }
    }


    let out = ReactDOM.render(React.createElement(App, null), mountNode);
    out.reachMinItems();
    return out;
};