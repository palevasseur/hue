// https://medium.com/code-oil/webpack-javascript-bundling-for-both-front-end-and-back-end-b95f1b429810
const path = require('path');
const nodeExternals = require('webpack-node-externals');
module.exports = {
  target: "node",
  entry: {
    app: ["./index.js"]
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle-hue-back.js"
  },
  externals: [nodeExternals()],
};