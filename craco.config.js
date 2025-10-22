const webpack = require('webpack');
const path = require('path');
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      //  Node.js 내장 모듈 폴리필 추가
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        vm: require.resolve('vm-browserify'), // ✅ 추가된 부분
        fs: false, // 브라우저에서는 fs 불필요
      };

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@Style': path.resolve(__dirname, 'src/styles'),
        '@Components': path.resolve(__dirname, 'src/components'),
        '@Pages': path.resolve(__dirname, 'src/pages'),
        '@Utils': path.resolve(__dirname, 'src/utils'),
      };


      //  브라우저에서 Node 전역 객체 흉내내기
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      ];

      return webpackConfig;
    },
  },
};
