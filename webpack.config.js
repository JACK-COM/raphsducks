/******************************************
 *  Author : Mr Jackdaw
 *  Created On : Thu Mar 29 2018
 *  File : webpack.config.js
 *******************************************/

const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'raphsducks.js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['babel-preset-env']
                }
            }
        }]
    },
    optimization: {
        minimize: true
    },
    mode: 'production'
};