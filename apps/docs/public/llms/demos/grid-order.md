# Grid 栅格 · 排序与分布（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/grid/demos/order.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

order 改变视觉顺序而不动 DOM 顺序，justify 控制主轴分布。

## 完整源码

```tsx
import { Col, Row } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '排序与分布',
  description: 'order 改变视觉顺序而不动 DOM 顺序，justify 控制主轴分布。',
};

export default function Order() {
  return (
    <>
      <DemoSection title="order 排序">
        <Row gutter="small" class="demo-grid-row">
          <Col span={6} order={3}>
            DOM 第一 · order 3
          </Col>
          <Col span={6} order={1}>
            DOM 第二 · order 1
          </Col>
          <Col span={6} order={2}>
            DOM 第三 · order 2
          </Col>
        </Row>
      </DemoSection>
      <DemoSection title="主轴分布">
        <Row justify="space-around" class="demo-grid-row">
          <Col span={4}>space-around 1</Col>
          <Col span={4}>space-around 2</Col>
          <Col span={4}>space-around 3</Col>
        </Row>
        <Row justify="center" class="demo-grid-row">
          <Col span={6}>center 1</Col>
          <Col span={6}>center 2</Col>
        </Row>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Grid 栅格 API](../exports/grid.md)
- [设计 Token](../design/tokens.md)
