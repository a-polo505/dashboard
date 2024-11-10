const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      // Обробка CSS файлів
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      // Обробка JavaScript файлів
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      // Обробка зображень та шрифтів
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    // Вивід CSS в окремий файл
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
    // Генерація index.html з автоматичним підключенням скриптів та стилів
    new HtmlWebpackPlugin({
      template: 'index.html',
      favicon: './src/images/favicon.png',
    }),
  ],
};