const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const config = {
    entry: './src/index.js',
    mode: 'production',
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
                    'babel-loader'
                ],
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [
            new UglifyJsPlugin({
                test: /\.js$/,
                uglifyOptions: {
                    ecma: 6,
                    mangle: {
                        toplevel: true,
                    },
                    output: {
                        ecma: 6,
                    },
                    compress: {
                        ecma: 6,
                        hoist_funs: true,
                        keep_fargs: false,
                        toplevel: true,
                    }
                }
            })
        ]
    }
};

module.exports = config;