# Webpack 5 消费

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`examples/webpack/**` 的真实配置与入口源码；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

工作区项目 `solid-craft-example-webpack`。`"solid"` 条件让构建器命中 `dist/source/*.jsx`，构建产物中实际纳入的模块记录在 `examples/webpack/dist/resolved.json`，由 `pnpm smoke:consumers` 校验。

## 依赖与命令

| 字段 | 值 |
| --- | --- |
| `dependencies` | `{"solid-craft":"workspace:*","solid-js":"1.9.18"}` |
| `devDependencies` | `{"@babel/core":"7.29.13","@babel/preset-typescript":"7.29.7","babel-loader":"10.1.1","babel-preset-solid":"1.9.16","css-loader":"7.1.5","mini-css-extract-plugin":"2.10.2","typescript":"7.0.2","webpack":"5.112.2"}` |
| `scripts` | `{"bundle":"node scripts/bundle.mjs","typecheck":"tsc --noEmit -p tsconfig.json"}` |

## 构建器配置（全文）

```js
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
```

## 入口源码（全文）

```tsx
import { render } from 'solid-js/web';
import { Button } from 'solid-craft/button';
import { ConfigProvider } from 'solid-craft/config-provider';
import 'solid-craft/styles.css';

/**
 * S-01 最小消费页面：只按子路径引入 Button / ConfigProvider，
 * 供 check-consumers.mjs 验证 tree-shaking（其他组件不得进入 bundle）。
 */
const root = document.getElementById('app');
if (!root) {
  throw new Error('[example-webpack] missing #app container');
}

render(
  () => (
    <ConfigProvider theme="light" density="default" direction="ltr">
      <Button>三端消费冒烟</Button>
    </ConfigProvider>
  ),
  root,
);
```

## 相关页面

- [快速开始](../guides/getting-started.md)
- [SSR 与 Hydration](../guides/ssr.md)
- [子路径与条件导出](../exports/root.md)
