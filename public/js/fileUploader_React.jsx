/**
 *
 * @param mountNode el
 * @param MD5S bool
 * @param fileID string
 * @param MD5ID string
 * @returns self
 */

function fileUploader(mountNode, MD5S, fileID, MD5ID) {

  var socket = io(window.location.host);
  var Files = [];

  var App = React.createClass({
    getInitialState: function getInitialState() {
      return {inputGroups: [1], setAcceptedTypes: [], paired: false, min: 1};
    },
    addInputGroups: function addInputGroups() {
      console.log('adding group');
      return (<InputGroup paired={this.state.paired}/>)
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
      this.setState({min: min});
      this.reachMinItems();
      return this;
    },
    setAcceptedTypes: function (types) {
      this.setState({acceptedTypes: types});
      return this;
    },
    render: function render() {
      return (
        <div>
          {this.state.inputGroups.map(this.addInputGroups)}
        </div>
      )
    }
  });

  var InputItem = React.createClass({
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
        md5 = (
          <div>
            <label>MD5</label>
            <span>The digital "fingerprint" of your file. Should be in the documents that you got from your sequencing provider.</span>
            <input type="text" required/>
          </div>
        )
      }
      return (
        <div>
          <span>{tooltip}</span>
          <label>{label}</label>
          <input type="file" required/>
          {md5}
        </div>
      )
    }
  });

  var InputGroup = React.createClass({
    //if paired mated this should contain 2 inputs
    render: function render() {

      var inputs = [<InputItem type="1"/>];
      if (this.props.paired) {
        inputs.push(<InputItem type="2"/>)
      }


      return (
        <div>
          {inputs}
        </div>
      )
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
    console.log('going to start', File.reader, File);
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


  var out = ReactDOM.render(React.createElement(App, null), mountNode);

  //out.reachMinItems();
  return out;
}