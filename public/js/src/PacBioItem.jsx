import React from 'react';
import UploadItem from './UploadItem.jsx';

export default class PacBioItem extends React.Component {
    render() {
        const baxAccept = [".bax.h5", ".bax.h5", ".bax.h5"];
        const basAccept = [".bas.h5"];
        const metaAccept = [".metadata.xml"];
        // const ind = '-' + this.props.groupIndex; //+ pairNumber;


        // const bax1 = fileID + ind + '-bax1';
        // const bax2 = fileID + ind + '-bax2';
        // const bax3 = fileID + ind + '-bax3';

        return (

            <div>
                <label>Bax Files</label>
                <span>put some text here</span>
                <br/>

                <UploadItem label="BAX1" accept={baxAccept}/>
                <UploadItem label="BAX2" accept={baxAccept}/>
                <UploadItem label="BAX3" accept={baxAccept}/>
                <UploadItem label="Bas" accept={basAccept}/>
                <UploadItem label="Meta" accept={metaAccept}/>

            </div>
        )

    }
}
