# solid-craft

## 0.1.0

### Minor Changes

- 首个公开版本：33 个 P0 组件（表单、数据展示、导航、反馈），状态统一由 `data-scui-*` 驱动。
- Token 管线：DTCG → CSS 变量 / TS / JSON，亮暗双主题与构建期对比度校验。
- 双构建：`dist/esm` 与保留 JSX 的 `dist/source`，每个组件子路径同时提供 `types` / `solid` / `import`。
- SSR：模块顶层无 DOM 访问，`renderToString` 与 SolidStart hydration 冒烟通过。
- 文档站：同源 Demo、API 表、搜索与 `llms.txt`。
