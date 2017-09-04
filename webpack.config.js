const path = require('path');
// const webpack = require('webpack');
module.exports = {
    entry: {
        fileUploader: [
            path.resolve(path.join(__dirname, "public", "js", 'src', 'FileUploader.jsx'))
        ],
    },
    devtool: "source-map",
    watch: true,
    module: {
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {test: /\.css$/, loader: "style-loader!css-loader"},
        ]
    },
    plugins: [
        // new webpack.optimize.ModuleConcatenationPlugin(),
        // new webpack.optimize.UglifyJsPlugin({minimize: true})
    ],
    output: {
        path: path.join(__dirname, "public", "js"),
        filename: '[name].min.js'
    },
};