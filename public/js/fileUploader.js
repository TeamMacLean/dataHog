"use strict";
/* exported fileUploader */
/* globals React, ReactDOM, alert */
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
      var paired = self.props.paired;


      function makeItem(p) {
        var md5Input = null;
        var pairNumber = '';
        var label = '';
        if (p) {
          if (p === 1) {
            label = 'First read file (R1)';
          } else if (p === 2) {
            label = 'Second read file (R2)';
          }
          pairNumber = '-' + p;
        }

        var ind = '-' + self.props.index + pairNumber;

        if (MD5S) {
          md5Input = React.createElement('div', {},
            React.createElement('label', {}, 'md5 ',
              React.createElement('i', {
                className: "fa fa-info-circle tooltip",
                title: 'The digital "fingerprint" of your file. Should be in the documents that you got from your sequencing provider. Otherwise,please consult the <a href="">TSL RDA manual</a>.'
              })
            ),
            React.createElement('input', {type: 'text', id: MD5ID + ind, name: MD5ID + ind}),
            React.createElement('br'),
            React.createElement('br')
          );
        }

        var imCool = null;
        if (self.acceptedTypes && self.acceptedTypes.length > 0) {
          self.acceptedTypes.map(function (fta) {
            if (imCool.length > 0) {
              imCool += ', ' + fta;
            } else {
              imCool = fta;
            }
          });
        }


        return React.createElement('div', {},
          React.createElement('label', {}, label),
          React.createElement('input', {
            type: 'file',
            id: fileID + ind,
            name: fileID + ind,
            accepts: imCool
          }),
          React.createElement('br'),
          React.createElement('br'),
          md5Input);
      }

      var subs = [];

      if (paired) {
        subs.push(makeItem(1));
        subs.push(React.createElement('hr'));
        subs.push(makeItem(2));
      } else {
        subs.push(makeItem());
      }


      return React.createElement('div', {className: 'file-group'},
        subs,
        React.createElement('input', {
          type: 'button',
          value: 'remove',
          className: 'error',
          onClick: self.props.removeInput
        })
      );
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
          React.createElement(item, {
            removeInput: self.removeInput,
            setAcceptedTypes: self.setAcceptedTypes,
            index: index,
            paired: self.state.paired
          }),
          React.createElement('br')
        );
      };
      return React.createElement(
        'div',
        {},
        this.state.items.map(toList),
        React.createElement(
          'input',
          {type: 'button', className: 'button', onClick: this.addInput, value: 'add another'}
        )
      );
    },
    setPaired: function setPairs(bool) {

      if (!bool || bool === false) {
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
    },
    setAcceptedTypes: function (types) {
      this.setState({acceptedTypes: types});
      return this;
    }
  });


  var out = ReactDOM.render(React.createElement(app, null), mountNode);

  out.reachMinItems();
  return out;
}