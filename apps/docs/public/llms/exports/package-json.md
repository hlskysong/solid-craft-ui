# 子路径 `solid-craft/package.json`

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

`solid-craft/package.json` 是 `solid-craft` 的公开子路径，条件导出如下。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `default` | `./package.json` | 字符串简写，无条件分支 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/package.json';
```

## API

该子路径不暴露组件 Props。

## 包元信息

| 字段 | 值 |
| --- | --- |
| `name` | `solid-craft` |
| `version` | `0.1.0` |
| `type` | `module` |
| `license` | `MIT` |
| `sideEffects` | `["**/*.css"]` |
| `dependencies` | `{"solid-craft-icons":"workspace:^","solid-craft-tokens":"workspace:^","@floating-ui/dom":"^1.8.0","@internationalized/date":"^3.12.4","@kobalte/core":"^0.13.14","@tanstack/solid-table":"^9.3.1"}` |
| `peerDependencies` | `{"solid-js":"^1.9.0"}` |

## 全部 exports 子路径

- `.` → [solid-craft](../exports/root.md)
- `./button` → [solid-craft/button](../exports/button.md)
- `./icon` → [solid-craft/icon](../exports/icon.md)
- `./typography` → [solid-craft/typography](../exports/typography.md)
- `./space` → [solid-craft/space](../exports/space.md)
- `./divider` → [solid-craft/divider](../exports/divider.md)
- `./layout` → [solid-craft/layout](../exports/layout.md)
- `./grid` → [solid-craft/grid](../exports/grid.md)
- `./input` → [solid-craft/input](../exports/input.md)
- `./checkbox` → [solid-craft/checkbox](../exports/checkbox.md)
- `./radio` → [solid-craft/radio](../exports/radio.md)
- `./switch` → [solid-craft/switch](../exports/switch.md)
- `./config-provider` → [solid-craft/config-provider](../exports/config-provider.md)
- `./styles.css` → [solid-craft/styles.css](../exports/styles-css.md)
- `./styles/*` → [solid-craft/styles/*](../exports/styles.md)
- `./package.json` → [solid-craft/package.json](../exports/package-json.md)
