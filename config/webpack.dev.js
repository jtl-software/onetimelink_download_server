const path = require('path');

const config = {
    entry: './src/index.js',
    mode: 'development',
    target: 'node',
    output: {
        path: path.resolve(__dirname, '../build'),
        filename: 'bundle.js'
    },
    resolve: {
        alias: {
            config: path.resolve(__dirname, '../config')
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|build)/,
                use: [
                    'babel-loader',
                    'eslint-loader'
                ],
            }
        ]
    }
};

module.exports = config;