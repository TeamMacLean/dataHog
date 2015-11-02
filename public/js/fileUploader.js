'use strict';

/**
 *
 * @param mountNode
 * @param MD5S
 * @param fileID
 * @param MD5ID
 */
function fileUploader(mountNode, MD5S, fileID, MD5ID) {

  var input = React.createClass({
    displayName: 'input',
    render: function render() {
      var self = this;
      var md5Input = null;
      if (MD5S) {
        md5Input = React.createElement('div', {},
          React.createElement('label', {}, 'MD5'),
          React.createElement('input', {type: 'text', id: MD5ID + '-' + self.props.index}),
          React.createElement('br'),
          React.createElement('br')
        )
      }
      return React.createElement('div', {className: 'file-group'},
        React.createElement('label', {}, 'File'),
        React.createElement('input', {type: 'file', id: fileID + '-' + self.props.index}),
        React.createElement('br'),
        React.createElement('br'),
        md5Input,
        React.createElement('input', {
          type: 'button',
          value: 'remove',
          className: 'error',
          onClick: self.props.removeInput
        })
      )
    }
  });

  var app = React.createClass({
    displayName: 'app',
    getInitialState: function getInitialState() {
      return {items: [], paired: false, min: 1};
    },
    addInput: function addInput() {
      var nextItems = this.state.items.concat([input]);
      this.setState({items: nextItems});
    },
    removeInput: function removeInput(input) {

      //TODO get count
      //TODO check its >= than min

      if (this.state.items.length > this.state.min) {
        var newData = this.state.items.slice(); //copy array
        var index = this.state.items.indexOf(input);
        newData.splice(index, 1); //remove element
        this.setState({items: newData}); //update state
      } else {
        alert('Must be at least ' + this.state.min + ' items');
      }


    },
    render: function render() {
      var self = this;
      var toList = function toList(item, index) {

        return React.createElement(
          'div',
          {key: index, className: 'no-decoration'},
          React.createElement(item, {removeInput: self.removeInput, index: index}),
          React.createElement('br')
        )
      };
      return React.createElement(
        'div',
        {},
        this.state.items.map(toList),
        React.createElement(
          'input',
          {type: 'button', className: 'button', onClick: this.addInput, value: 'add another'}
        )
      )
    },
    setPaired: function setPairs(bool) {

      if (!bool || bool == false) {
        this.setState({paired: false});
      } else {
        this.setState({paired: true});
      }
      return this;

    },
    reachMinItems: function reachMinItems() {
      while (out.state.items.length < out.state.min) {
        out.addInput();
      }
      return this;
    },
    setMin: function setMin(min) {
      this.setState({min: min});
      this.reachMinItems();
      return this;
    }
  });


  var out = ReactDOM.render(React.createElement(app, null), mountNode);
  //console.log(out);

  out.reachMinItems();
  return out;
}