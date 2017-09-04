import React from 'react';
import UploadItem from './UploadItem.jsx';

export default class FastQItem extends React.Component {

    render() {

        const self = this;
        // let pairNumber = '';
        let label = '';
        let tooltip = '';
        const type = self.props.type;

        if (type && type > 0) {

            tooltip =
                <span>Please upload your read file here. If you have paired end data, please choose the file that contains the forward reads (usually having "R1" in the filename).</span>;
            if (type === 1) {
                label = <label>First read file (R1)</label>
            } else if (type === 2) {
                tooltip =
                    <span>Please upload your read file here. Choose the file that contains the reverse reads (usually having "R2" in the filename).</span>;
                label = <label>Second read file (R2)</label>
            }
            // pairNumber = '-' + type;
        }

        // const ind = '-' + self.props.groupIndex + pairNumber;

        return (
            <UploadItem label={label} tooltip={tooltip} accept={['.fastq', '.fq', '.fastq.gz', '.fq.gz', '.gz']}/>
        )
    }
}