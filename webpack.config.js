const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// ── 환경변수 로딩 ──────────────────────────────────────────────
// 우선순위: .env.{NODE_ENV} → .env (공통 시크릿)
// NODE_ENV=production 이면 .env.production, 기본값은 .env.development
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, envFile) });   // 환경별 설정
dotenv.config({ path: path.resolve(__dirname, '.env') });    // 공통 시크릿 (덮어쓰기 안 함)

// ── PUBLIC_URL / publicPath ─────────────────────────────────────
// 로컬 개발 : PUBLIC_URL=''  → publicPath='/'   → http://localhost:3000/
// GitHub Pages (webpack prod) : PUBLIC_URL='/youth' → publicPath='/youth/'
const PUBLIC_URL = process.env.PUBLIC_URL || '';
const publicPath = PUBLIC_URL ? `${PUBLIC_URL}/` : '/';

// ── 프론트엔드에 주입할 환경변수 ────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3400';

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: ['./src/index.js'],
  output: {
    path: path.resolve(__dirname, 'docs'),
    publicPath,                            // 환경에 따라 '/' 또는 '/youth/'
    filename: '[name].bundle.js',
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  devServer: {
    static: path.resolve(__dirname, 'public'),
    port: 3000,
    historyApiFallback: true,
    // webpack devServer → Express 백엔드 프록시
    proxy: [
      {
        context: [
          '/newsApi', '/jobApi', '/residenceApi', '/welfareApi',
          '/educationApi', '/financeApi', '/join', '/login',
          '/LoginList', '/MyList', '/Logout',
        ],
        target: 'http://localhost:3400',
        changeOrigin: true,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
    }),
    new CopyPlugin({
      patterns: [{ from: 'src/assets/img', to: 'assets/img' }],
    }),
    // process.env 변수를 브라우저 번들에 정적 주입
    new webpack.DefinePlugin({
      'process.env.REACT_APP_API_URL': JSON.stringify(API_URL),
      'process.env.PUBLIC_URL':        JSON.stringify(PUBLIC_URL),
      'process.env.NODE_ENV':          JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
      {
        test: /\.(css|scss)$/i,
        use: ['style-loader', 'css-loader'],
        exclude: /node_modules/,
      },
      {
        // 이미지: 15 KB 이하 → base64 인라인 (경로 의존 없이 모든 환경 동작)
        // 카테고리 아이콘(5~8 KB)이 모두 인라인 처리됨
        test: /\.(jpg|jpeg|gif|png|svg|ico)$/i,
        loader: 'url-loader',
        options: {
          limit: 15000,
          name: '[name].[ext]?[hash]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
    },
  },
};
