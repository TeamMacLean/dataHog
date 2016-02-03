function fileUploader(mountNode, MD5S, fileID, MD5ID) {

  var input = React.createClass({
    render: function render() {
      <div>
        <h1>test</h1>
      </div>
    }
  })

}

//"use strict";
///* exported fileUploader */
///* globals React, ReactDOM, alert */
///**
// *
// * @param mountNode
// * @param MD5S
// * @param fileID
// * @param MD5ID
// */
//function fileUploader(mountNode, MD5S, fileID, MD5ID) {
//
//  var socket = io(window.location.host);
//  var Files = [];
//
//  socket.on('Complete', function (data) {
//    console.log('complete');
//    Files[data.UUID].percent = 100;
//    UpdateBar(Files[data.UUID].meter, 100);
//
//    var input = $(Files[data.UUID].input);
//
//    var nmval = input.data('input-name');
//    var name = 'file' + nmval.substring(nmval.indexOf('-'));
//
//    //remove any existing hidden fields, encase of a replaced file
//    var hiddenInput = input.parent().find('input[type=hidden]');
//
//    hiddenInput.val(data.UUID);
//
//    //TODO check if all uploads are complete and unlock the submit button
//
//    console.log('files', Files);
//
//    var incompleteUploads = Files.filter(function (f) {
//      return f.percent < 100;
//    });
//
//    if (incompleteUploads.length == 0) {
//      $('button[type=submit]').prop('disabled', false);
//    }
//
//  });
//
//  socket.on('MoreData', function (data) {
//    //console.log('more');
//    var File = Files[data.UUID];
//    Files[data.UUID].percent = data.Percent;
//    UpdateBar(File.meter, Files[data.UUID].percent);
//    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
//    var NewFile; //The Variable that will hold the new Block of Data
//    if (File.slice) {
//      NewFile = File.slice(Place, Place + Math.min(524288, (File.size - Place)));
//    }
//    else if (File.webkitSlice) {
//      NewFile = File.webkitSlice(Place, Place + Math.min(524288, (File.size - Place)));
//    }
//    else if (File.mozSlice) {
//      NewFile = File.mozSlice(Place, Place + Math.min(524288, (File.size - Place)));
//    } else {
//      alert('Sorry but your browser does not support this');
//    }
//    console.log('going to start', File.reader, File);
//    File.reader.readAsBinaryString(NewFile);
//  });
//
//  function reset() {
//    Files = [];
//    socket.emit('reset');
//  }
//
//  function UpdateBar(bar, percent) {
//    bar
//      .find('span')
//      .width(percent + '%')
//      .text(Math.round(percent) + '%');
//  }
//
//
//  var input = React.createClass({
//    displayName: 'input',
//    generateUUID: function generateUUID() {
//      var d = new Date().getTime();
//      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//        var r = (d + Math.random() * 16) % 16 | 0;
//        d = Math.floor(d / 16);
//        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
//      });
//    },
//    socketUpload: function socketUpload(a) {
//
//      var input = a.target;
//      var $input = $(input);
//
//      if (input.files.length) {
//
//        //console.log('socket uploading', input);
//
//        var uuid = this.generateUUID();
//
//        Files[uuid] = input.files[0];
//        Files[uuid].input = input;
//        Files[uuid].meter = $input.parent().find('.meter');
//        Files[uuid].meter.show();
//        Files[uuid].reader = new FileReader();
//        Files[uuid].percent = 0;
//
//        Files[uuid].reader.onloadend = function (evnt) {
//          socket.emit('Upload', {'Name': Files[uuid].name, Data: evnt.target.result, 'UUID': uuid});
//        };
//
//        //TODO lock the submit button
//        $('button[type=submit]').prop('disabled', true);
//
//        socket.emit('Start', {
//          'Name': Files[uuid].name,
//          'Size': Files[uuid].size,
//          'Dir': window.location.pathname,
//          'UUID': uuid
//        });
//      } else {
//        console.log('no file in input');
//
//        var meter = $input.parent().find('.meter');
//
//        UpdateBar(meter, 0);
//        meter.hide();
//
//      }
//    },
//
//    render: function render() {
//      var self = this;
//      var paired = self.props.paired;
//
//
//      function makeItem(p) {
//        var md5Input = null;
//        var pairNumber = '';
//        var label = '';
//        var toolTip = '';
//        if (p) {
//          toolTip = React.createElement('span', {}, 'Please upload your read file here. If you have paired end data, please choose the file that contains the forward reads (usually having "R1" in the filename).');
//          if (p === 1) {
//            label = React.createElement('label', {}, 'First read file (R1)');
//          } else if (p === 2) {
//            toolTip = React.createElement('span', {}, 'Please upload your read file here. Choose the file that contains the reverse reads (usually having "R2" in the filename).');
//            label = React.createElement('label', {}, 'Second read file (R2)');
//          }
//          pairNumber = '-' + p;
//        }
//
//        var ind = '-' + self.props.index + pairNumber;
//
//        if (MD5S) {
//          md5Input = React.createElement('div', {},
//            React.createElement('label', {}, 'md5'),
//            React.createElement('span', {}, 'The digital "fingerprint" of your file. Should be in the documents that you got from your sequencing provider.'),
//            React.createElement('input', {type: 'text', id: MD5ID + ind, name: MD5ID + ind, required: "required"}),
//            React.createElement('br'),
//            React.createElement('br')
//          );
//        }
//
//        return React.createElement('div', {},
//          React.createElement('div', {}, label),
//          React.createElement('div', {}, toolTip),
//          React.createElement('input', {
//            type: 'file',
//            id: fileID + ind,
//            //name: fileID + ind,
//            "data-input-name": fileID + ind,
//            accept: self.props.acceptedTypes,
//            required: "required",
//            onChange: self.socketUpload
//          }),
//          React.createElement('input', {
//            type: 'hidden',
//            id: fileID + ind,
//            name: fileID + ind
//          }),
//          React.createElement('br'),
//          React.createElement('br'),
//          md5Input,
//          React.createElement(
//            'div',
//            {className: 'meter hidden'},
//            React.createElement(
//              'span',
//              null,
//              '100%'
//            )
//          )
//        )
//      }
//
//      var subs = [];
//
//      if (paired) {
//        subs.push(makeItem(1));
//        subs.push(React.createElement('hr'));
//        subs.push(makeItem(2));
//      } else {
//        subs.push(makeItem());
//      }
//
//
//      return React.createElement('div', {className: 'file-group'},
//        subs,
//        React.createElement('input', {
//          type: 'button',
//          value: 'remove',
//          className: 'error thin',
//          onClick: self.props.removeInput.bind(this, this)
//        })
//      )
//    }
//  });
//
//  var app = React.createClass({
//    displayName: 'app',
//    getInitialState: function getInitialState() {
//      return {items: [], paired: false, min: 1};
//    },
//    addInput: function addInput() {
//
//      //console.log('adding input');
//
//      var self = this;
//      var newInput = React.createElement(
//        'div',
//        {className: 'no-decoration'},
//        React.createElement(input, {
//          removeInput: self.removeInput.bind(this, this),
//          acceptedTypes: self.state.acceptedTypes,
//          setAcceptedTypes: self.setAcceptedTypes,
//          //index: index,
//          paired: self.state.paired
//        }),
//        React.createElement('br')
//      );
//
//      console.log('old items', self.state.items);
//      self.setState({items: self.state.items.concat([newInput])});
//      console.log('items', self.state.items);
//    },
//    removeInput: function removeInput(a, b) {
//
//      if (this.state.items.length > this.state.min) {
//        console.log(a, b);
//        var newData = this.state.items.slice(); //copy array
//        var index = this.state.items.indexOf(input);
//        newData.splice(index, 1); //remove element
//        this.setState({items: newData}); //update state
//      } else {
//        alert('Must be at least ' + this.state.min + ' items');
//      }
//    },
//
//    setPaired: function setPairs(bool) {
//
//      if (!bool || bool === false) {
//        this.setState({paired: false});
//      } else {
//        this.setState({paired: true});
//      }
//      return this;
//
//    },
//    reachMinItems: function reachMinItems() {
//      while (out.state.items.length < out.state.min) {
//        out.addInput();
//      }
//      return this;
//    },
//    setMin: function setMin(min) {
//      this.setState({min: min});
//      this.reachMinItems();
//      return this;
//    },
//    setAcceptedTypes: function (types) {
//      this.setState({acceptedTypes: types});
//      return this;
//    },
//    render: function render() {
//      return React.createElement(
//        'div',
//        {},
//        this.state.items,
//        React.createElement(
//          'input',
//          {type: 'button', className: 'button primary thin', onClick: this.addInput, value: 'add another'}
//        )
//      );
//    }
//  });
//
//
//  var out = ReactDOM.render(React.createElement(app, null), mountNode);
//
//  out.reachMinItems();
//  return out;
//}
