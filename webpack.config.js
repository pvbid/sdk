var path = require("path");
var webpack = require("webpack");
const MinifyPlugin = require("babel-minify-webpack-plugin");
var CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
    entry: ["./src/pvbid.js"],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: process.env.PLATFORM === "node" ? "pvbid.node.js" : "pvbid.web.js",
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
                loader: "babel",
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

    plugins: [
        //new LodashModuleReplacementPlugin(),
        /* new MinifyPlugin({}, { comments: false }),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/,
            threshold: 10240,
            minRatio: 0.8
        })
        */
    ],
    devtool: "source-map",
    watch: process.env.WATCH === "true" ? true : false,
    target: process.env.PLATFORM === "node" ? "node" : "web"
};
