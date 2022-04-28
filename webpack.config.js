const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// const webpack = require('webpack');
// const nodeExternals = require('webpack-node-externals');


module.exports = ['source-map'].map((devtool) => ({
  // watch: true,
  mode: 'production', // development | production
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'biciCockpit',
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        exclude: path.resolve(__dirname, 'src/assets/css'),
        use: ['style-loader', { loader: 'css-loader', options: { modules: true } }],
      },
      {
        test: /\.css$/i,
        include: path.resolve(__dirname, 'src/assets/css'),
        use: ['style-loader', { loader: 'css-loader' }],
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                modifyVars: {
                  '@ant-prefix': 'antd-bici-cockpit',
                },
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 81920000,
            },
          },
        ],
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-proposal-class-properties'],
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin()
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2
        }
      }
    }
  },
  externals: ['react', 'react-dom', 'bici-transformers', '@ant-design/icons','lodash','moment'],
}));
