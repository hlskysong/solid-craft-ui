# Vite 消费

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`examples/vite/**` 的真实配置与入口源码；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

工作区项目 `solid-craft-example-vite`。`"solid"` 条件让构建器命中 `dist/source/*.jsx`，构建产物中实际纳入的模块记录在 `examples/vite/dist/resolved.json`，由 `pnpm smoke:consumers` 校验。

## 依赖与命令

| 字段 | 值 |
| --- | --- |
| `dependencies` | `{"solid-craft":"workspace:*","solid-js":"1.9.18"}` |
| `devDependencies` | `{"typescript":"7.0.2","vite":"8.3.6","vite-plugin-solid":"2.11.15"}` |
| `scripts` | `{"bundle":"vite build","typecheck":"tsc --noEmit -p tsconfig.json"}` |

## 构建器配置（全文）

```js
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

const distDir = fileURLToPath(new URL('./dist/', import.meta.url));

/** 记录 Rollup 实际纳入的 solid-craft 模块路径，用于实证 `"solid"` 条件命中。 */
function recordResolved() {
  return {
    name: 'record-resolved-core-modules',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const modules = Object.values(bundle).flatMap((chunk) => {
        const record = chunk;
        return 'modules' in record ? Object.keys(record.modules ?? {}) : [];
      });
      mkdirSync(distDir, { recursive: true });
      writeFileSync(
        `${distDir}resolved.json`,
        `${JSON.stringify(
          [...new Set(modules)].toSorted((a, b) => a.localeCompare(b)),
          null,
          2,
        )}\n`,
      );
    },
  };
}

export default defineConfig({
  // vite-plugin-solid 会自动把 "solid" 注入 resolve.conditions。
  plugins: [solid(), recordResolved()],
  build: {
    minify: false,
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'bundle.js',
    },
  },
});
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
  throw new Error('[example-vite] missing #app container');
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
