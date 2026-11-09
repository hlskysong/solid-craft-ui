# Grid 栅格 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/grid/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

24 栅格、偏移与对齐换行。

## 完整源码

```tsx
import { Col, Row } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '24 栅格、偏移与对齐换行。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="24 栅格">
        <Row gutter="medium" class="demo-grid-row">
          <Col span={6}>span 6</Col>
          <Col span={6}>span 6</Col>
          <Col span={6}>span 6</Col>
          <Col span={6}>span 6</Col>
        </Row>
        <Row gutter="large" class="demo-grid-row">
          <Col span={8} offset={2}>
            span 8 / offset 2
          </Col>
          <Col span={12}>span 12</Col>
        </Row>
      </DemoSection>
      <DemoSection title="对齐与换行">
        <Row align="middle" justify="space-between" class="demo-grid-row">
          <Col span={5}>left</Col>
          <Col span={5}>right</Col>
        </Row>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Grid 栅格 API](../exports/grid.md)
- [设计 Token](../design/tokens.md)
