/*
   required props:
       label
       id

   optional props:
       acceptedTypes
       toolTip
    */

import React from 'react';

export default class UploadItem extends React.Component {
    socketUpload(inputItem, event) {
        const input = event.target;
        const $input = $(input);

        if (input.files.length) {

            const uuid = util.generateUUID();

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
    }


    render() {

        const self = this;
        // const type = self.props.type;

        //TODO unique ID (to be used got item and MD5)

        // const FASTQ_TYPES = ['.fastq', '.fq', '.fastq.gz', '.fq.gz', '.gz'];

        const accept = self.props.accept | [];
        const tooltip = self.props.tooltip;
        const label = self.props.label;

        const id = self.props.id;

        let md5 = null;

        // const ind = '-' + self.props.groupIndex + pairNumber;

        if (MD5S) {
            md5 = (
                <div>
                    <br/>
                    <label>MD5</label>
                    <span>The digital "fingerprint" of your file. Should be in the documents that you got from your sequencing provider.</span>
                    <input type="text" id={MD5ID + id} name={MD5ID + id} key={MD5ID + id} required/>
                    <br/>
                </div>
            )
        }
        return (
            <div>
                <label>{label}</label>
                <span>{tooltip}</span>
                <input type="file" id={fileID + ind} accept={accept}
                       onChange={self.socketUpload.bind(null, this)}
                       data-input-name={fileID + id} required/>
                <input type="hidden" id={fileID + id} key={fileID + id} name={fileID + id}/>
                <br/>
                {md5}
                <div className="meter hidden">
                    <span>0%</span>
                </div>
                <br/>
            </div>
        )
    }
}