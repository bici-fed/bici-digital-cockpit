const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = ["source-map"].map((devtool) => ({
  mode: "development", // development | production
  devtool,
  entry: path.resolve(__dirname, "src/index.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    library: "biciCockpit",
    libraryTarget: "umd",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", { loader: "css-loader", options: { modules: true } }],
      },
      {
        test: /\.less$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                modifyVars: {
                  "@ant-prefix": "antd-bici-cockpit",
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
            loader: "url-loader",
            options: {
              limit: 819200,
            },
          },
        ],
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["@babel/plugin-proposal-class-properties"],
          },
        },
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
  externals: ["react", "react-dom", "bici-transformers", "@ant-design/icons"],
}));
