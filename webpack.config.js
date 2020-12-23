'use strict';

const path = require('path');
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');

function resolve(pathname) {
  return path.resolve(__dirname, pathname);
}

module.exports = {
  mode: 'production',
  entry: resolve('src/index.js'),
  output: {
    path: resolve('dist'),
    filename: 'bici-digital-cockpit.js',
    library: 'BiciDigitalCockpit',
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      '@': resolve('src'),
    },
    extensions: ['.js', '.json', '.css'],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: resolve('src/components'),
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.css$/,
        include: resolve('src/components'),
        use: ['style-loader', { loader: 'css-loader', options: { modules: true } }],
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
    ],
  },
  plugins: [new AntdDayjsWebpackPlugin()],
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      minChunks: 3,
      automaticNameDelimiter: '.',
      cacheGroups: {
        vendor: {
          name: 'vendors',
          test({ resource }) {
            return /[\\/]node_modules[\\/]/.test(resource);
          },
          priority: 10,
        },
      },
    },
  },
  externals: [
    'react',
    'react-dom',
    'prop-types',
    'lodash',
    'dayjs',
    /^@ant-design\/.+$/,
    /^dayjs\/plugin\/.+$/,
    /^antd\/es\/.+$/,
  ],
};
