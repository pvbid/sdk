var path = require("path");
var webpack = require("webpack");
const MinifyPlugin = require("babel-minify-webpack-plugin");
var CompressionPlugin = require("compression-webpack-plugin");
const HappyPack = require("happypack");
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

plugins.push(
    new HappyPack({
        // 3) re-add the loaders you replaced above in #1:
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel",
                query: {
                    presets: [["es2015", { modules: false }], "stage-1"],
                    plugins: ["lodash", "transform-runtime", "syntax-async-functions", "transform-regenerator"]
                }
            }
        ]
    })
);
if(!process.env.SKIP_MIN) plugins.push(new MinifyPlugin({}, { comments: false }));
//plugins.push(new LodashModuleReplacementPlugin());
/*
plugins.push(
    new CompressionPlugin({
        asset: "[path].gz[query]",
        algorithm: "gzip",
        test: /\.js$|\.css$|\.html$/,
        threshold: 10240,
        minRatio: 0.8
    })
);
*/

module.exports = {
    entry: ["./src/pvbid.js"],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: process.env.PLATFORM === "node" ? "pvbid.node.js" : "pvbid.min.js",
        library: "PVBid",
        libraryTarget: "umd"
    },
    resolveLoader: {
        moduleExtensions: ["-loader"]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "happypack/loader", //"babel",
                query: {
                    presets: [["es2015", { modules: false }], "stage-1"],
                    plugins: ["lodash", "transform-runtime", "syntax-async-functions", "transform-regenerator"]
                }
            }
        ]
        /* loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                query: {
                    presets: [["es2015", { modules: false }], "stage-1"],
                    plugins: ["syntax-async-functions", "transform-regenerator", "transform-runtime"]
                }
            }
        ]*/
    },
    stats: {
        colors: true
    },
    plugins: plugins,
    devtool: "source-map",
    watch: process.env.WATCH === "true" ? true : false,
    target: process.env.PLATFORM === "node" ? "node" : "web"
};
