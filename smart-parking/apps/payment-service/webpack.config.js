const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const {
  prismaGeneratedClientRule,
  prismaWebpackExternals,
  prismaWebpackPlugins,
} = require('../../webpack.prisma.config.js');

const webpackConfig = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  resolve: {
    plugins: [
      new TsconfigPathsPlugin({
        configFile: join(__dirname, '../../tsconfig.base.json'),
      }),
    ],
  },
  module: {
    rules: [prismaGeneratedClientRule()],
  },
  externals: prismaWebpackExternals(__dirname),
  plugins: [
    ...prismaWebpackPlugins(),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};

module.exports = webpackConfig;
