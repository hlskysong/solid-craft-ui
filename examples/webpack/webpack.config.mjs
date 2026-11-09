import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const here = fileURLToPath(new URL('.', import.meta.url));
const coreSourceDir = path.resolve(here, '../../packages/core/dist/source');
const resolved = new Set();

/**
 * 记录 webpack 实际解析到的 solid-craft 模块路径。
 * 用于实证 resolve.conditionNames 里的 "solid" 命中了 dist/source/*.jsx。
 */
function collect(resource) {
  if (typeof resource === 'string' && resource.includes('core/dist')) {
    resolved.add(resource.replaceAll(path.sep, '/'));
  }
}

class RecordCoreModules {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('RecordCoreModules', (factory) => {
      factory.hooks.afterResolve.tap('RecordCoreModules', (data) => {
        collect(data?.createData?.resource);
      });
    });
    compiler.hooks.compilation.tap('RecordCoreModules', (compilation) => {
      compilation.hooks.succeedModule.tap('RecordCoreModules', (module) => {
        collect(module?.resource);
      });
    });
    compiler.hooks.done.tap('RecordCoreModules', () => {
      mkdirSync(path.join(here, 'dist'), { recursive: true });
      writeFileSync(
        path.join(here, 'dist', 'resolved.json'),
        `${JSON.stringify(
          [...resolved].toSorted((a, b) => a.localeCompare(b)),
          null,
          2,
        )}\n`,
      );
    });
  }
}

export default {
  mode: 'production',
  context: here,
  entry: './src/index.tsx',
  output: {
    path: path.join(here, 'dist'),
    filename: 'bundle.js',
    clean: false,
  },
  optimization: {
    minimize: false,
    usedExports: true,
    sideEffects: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    // "solid" 条件命中 dist/source/*.jsx（保留 JSX 的源码产物）；
    // browser 条件保证 solid-js 解析到客户端构建。
    conditionNames: ['solid', 'webpack', 'browser', 'import', 'default'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        include: [path.join(here, 'src'), coreSourceDir],
        resolve: { fullySpecified: false },
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            configFile: false,
            presets: [
              ['babel-preset-solid', { generate: 'dom', hydratable: false }],
              ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: 'bundle.css' }), new RecordCoreModules()],
};
