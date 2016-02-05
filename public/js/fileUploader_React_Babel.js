/**
 *
 * @param mountNode el
 * @param MD5S bool
 * @param fileID string
 * @param MD5ID string
 * @returns self
 */

'use strict';

function fileUploader(mountNode, MD5S, fileID, MD5ID) {

  var socket = io(window.location.host);
  var Files = [];

  var App = React.createClass({
    displayName: 'App',

    getInitialState: function getInitialState() {
      return { inputGroups: [1], setAcceptedTypes: [], paired: false, min: 1 };
    },
    addInputGroups: function addInputGroups() {
      console.log('adding group');
      return React.createElement(InputGroup, { paired: this.state.paired });
    },
    reachMinItems: function reachMinItems() {
      //while (out.state.items.length < out.state.min) {
      //  out.addInput();
      //}
      return this;
    },
    setPaired: function setPaired() {
      return this;
    },
    setMin: function setMin(min) {
      this.setState({ min: min });
      this.reachMinItems();
      return this;
    },
    setAcceptedTypes: function setAcceptedTypes(types) {
      this.setState({ acceptedTypes: types });
      return this;
    },
    render: function render() {
      return React.createElement(
        'div',
        null,
        this.state.inputGroups.map(this.addInputGroups)
      );
    }
  });

  var InputItem = React.createClass({
    displayName: 'InputItem',

    render: function render() {

      var type = this.props.type;

      var tooltip = 'Please upload your read file here. If you have paired end data, please choose the file that contains the forward reads (usually having "R1" in the filename).';
      var label = 'First read file (R1)';
      if (type == 2) {
        tooltip = 'Please upload your read file here. Choose the file that contains the reverse reads (usually having "R2" in the filename).';
        label = 'Second read file (R2)';
      }

      var md5 = null;

      if (MD5S) {
        md5 = React.createElement(
          'div',
          null,
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
          React.createElement('input', { type: 'text', required: true })
        );
      }
      return React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          null,
          tooltip
        ),
        React.createElement(
          'label',
          null,
          label
        ),
        React.createElement('input', { type: 'file', required: true }),
        md5
      );
    }
  });

  var InputGroup = React.createClass({
    displayName: 'InputGroup',

    //if paired mated this should contain 2 inputs
    render: function render() {

      var inputs = [React.createElement(InputItem, { type: '1' })];
      if (this.props.paired) {
        inputs.push(React.createElement(InputItem, { type: '2' }));
      }

      return React.createElement(
        'div',
        null,
        inputs
      );
    }
  });

  socket.on('Complete', function (data) {
    console.log('complete');
    Files[data.UUID].percent = 100;
    UpdateBar(Files[data.UUID].meter, 100);

    var input = $(Files[data.UUID].input);

    var nmval = input.data('input-name');
    var name = 'file' + nmval.substring(nmval.indexOf('-'));

    //remove any existing hidden fields, encase of a replaced file
    var hiddenInput = input.parent().find('input[type=hidden]');

    hiddenInput.val(data.UUID);

    //TODO check if all uploads are complete and unlock the submit button

    console.log('files', Files);

    var incompleteUploads = Files.filter(function (f) {
      return f.percent < 100;
    });

    if (incompleteUploads.length == 0) {
      $('button[type=submit]').prop('disabled', false);
    }
  });

  socket.on('MoreData', function (data) {
    //console.log('more');
    var File = Files[data.UUID];
    Files[data.UUID].percent = data.Percent;
    UpdateBar(File.meter, Files[data.UUID].percent);
    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
    var NewFile; //The Variable that will hold the new Block of Data
    if (File.slice) {
      NewFile = File.slice(Place, Place + Math.min(524288, File.size - Place));
    } else if (File.webkitSlice) {
      NewFile = File.webkitSlice(Place, Place + Math.min(524288, File.size - Place));
    } else if (File.mozSlice) {
      NewFile = File.mozSlice(Place, Place + Math.min(524288, File.size - Place));
    } else {
      alert('Sorry but your browser does not support this');
    }
    console.log('going to start', File.reader, File);
    File.reader.readAsBinaryString(NewFile);
  });

  function reset() {
    Files = [];
    socket.emit('reset');
  }

  function UpdateBar(bar, percent) {
    bar.find('span').width(percent + '%').text(Math.round(percent) + '%');
  }

  var out = ReactDOM.render(React.createElement(App, null), mountNode);

  //out.reachMinItems();
  return out;
}