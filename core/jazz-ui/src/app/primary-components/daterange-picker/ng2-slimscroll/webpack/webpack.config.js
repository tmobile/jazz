const path = require('path');
const root = path.resolve(__dirname, '../');
const webpack = require('webpack');

module.exports = {
  resolve: { extensions: ['.ts'] },
  entry: path.join(root, 'index.ts'),
  output: {
    path: path.join(root, 'bundles'),
    publicPath: '/',
    filename: 'ng2-slimscroll.umd.js',
    libraryTarget: 'umd',
    library: 'ng2-slimscroll'
  },
  externals: [/^\@angular\//, /^rxjs\//],
  module: {
    rules: [
      { test: /\.ts$/, loader: 'awesome-typescript-loader?declaration=false' }
    ]
  }
};
