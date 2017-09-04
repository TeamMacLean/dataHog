import util from './util';
import React from 'react';
import PacBioItem from './PacBioItem.jsx';
import FastQItem from './FastQItem.jsx';

export default class InputGroup extends React.Component {
    // let InputGroup = React.createClass({

    render() {
        const inputs = [];

        const MD5S = this.props.MD5S;

        if (this.props.pacBio) {
            inputs.push(<PacBioItem type={1} groupIndex={this.props.index} key={util.generateUUID()}
                                    guuid={this.props.guuid} MD5S={MD5S}/>);
        } else if (this.props.paired) {
            inputs.push(<FastQItem type={1} groupIndex={this.props.index} key={util.generateUUID()}
                                   guuid={this.props.guuid}  MD5S={MD5S}/>);
            inputs.push(<hr key={util.generateUUID()}/>);
            inputs.push(<FastQItem type={2} groupIndex={this.props.index} key={util.generateUUID()}
                                   guuid={this.props.guuid}  MD5S={MD5S}/>)

        } else {
            inputs.push(<FastQItem type={0} groupIndex={this.props.index} key={util.generateUUID()}
                                   guuid={this.props.guuid}  MD5S={MD5S}/>);
        }
        return (
            <div>
                <div className="file-group">
                    {inputs}
                    <button className="error thin" onClick={(e) => this.props.removeGroup(e, this)}>REMOVE
                    </button>
                    <br/>
                </div>
                <br/>
            </div>
        )
    }
}