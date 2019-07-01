var path = require("path");
var webpack = require("webpack");
var S3Plugin = require("webpack-s3-plugin");
require("dotenv").config();

let plugins = [];
if (process.env.DOCS) {
    plugins.push(
        new S3Plugin({
            // Only upload css and js
            include: /.*\.(css|js|html|json|svg|png|md)/,
            directory: "docs",
            // s3Options are required
            s3Options: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: "us-west-1"
            },
            s3UploadOptions: {
                Bucket: "sdk.pvbid.com"
            }
        })
    );
}

module.exports = {
    entry: ["./src/pvbid.js"],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: process.env.PLATFORM === "node" ? "pvbid.node.js" : "pvbid.min.js",
        library: "PVBid",
        libraryTarget: "umd"
    },
    resolve: {
        extensions: ['.js', '.ts'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                query: {
                    presets: [['@babel/env', { 'targets': { 'node': 6 } }], "@babel/typescript"],
                    plugins: ["lodash", "@babel/plugin-transform-runtime", "syntax-async-functions", "@babel/plugin-transform-regenerator"]
                }
            },
        ]
    },
    stats: {
        colors: true
    },
    plugins: plugins,
    devtool: "source-map",
    watch: process.env.WATCH === "true" ? true : false,
    target: process.env.PLATFORM === "node" ? "node" : "web"
};
