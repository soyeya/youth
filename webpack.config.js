const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


var config = {
    entry: './App.js',
    //...
  };
  
  module.exports = (env, argv) => {
    if (argv.mode === 'development') {
      config.devtool = 'source-map';
    }
  
    if (argv.mode === 'production') {
    }
    return config;
  };
  
module.exports = {

     mode : "development",
     entry : [
        './src/index.js'
     ],
     output : {
        path :path.resolve(__dirname, "docs"),
        publicPath : '/',
        filename: "[name].bundle.js",
     },
     devtool : "source-map",
     devServer : {
        static : path.resolve(__dirname, "public"),
        port : process.env.PUBLIC_URL,
        historyApiFallback : true,
     },
     plugins : [
         new HtmlWebpackPlugin({
            template :  path.resolve(__dirname, 'public', 'index.html'),
         }),
         new CopyPlugin({ patterns: [{ from: 'src/assets/img', to: 'assets/img' }] })
     ],
     module : {
        rules: [
            {
              test: /\.(js|jsx)$/i,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
              },
            },
            {
              test: /\.(css|scss)$/i,
              use: ["style-loader", "css-loader"],
              exclude: /node_modules/,
          },
          {
            test: /\.(jpg|jpeg|gif|png|svg|ico)$/i,
            loader : 'url-loader',
            options : {
              publicPath : './docs/',
              name : '[name].[ext]?[hash]',
              limit : 2000,
            }
          }
          ],
     },
     resolve: {
        extensions: [".js", ".jsx"],
        fallback: { 
        stream: require.resolve('stream-browserify'),
        buffer : require.resolve("buffer/") 
        }
      }
}