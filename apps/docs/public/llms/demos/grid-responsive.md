# Grid 栅格 · 响应式断点（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/grid/demos/responsive.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

xs / sm / md / lg 四个断点在 1280 与 768 两个基线视口下的列数变化。

## 完整源码

```tsx
import { Col, Row } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '响应式断点',
  description: 'xs / sm / md / lg 四个断点在 1280 与 768 两个基线视口下的列数变化。',
};

export default function Responsive() {
  return (
    <>
      <DemoSection title="断点列数">
        <Row gutter="small" class="demo-grid-row">
          <Col xs={24} sm={12} md={8} lg={6}>
            xs 24 / sm 12 / md 8 / lg 6
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            xs 24 / sm 12 / md 8 / lg 6
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            xs 24 / sm 12 / md 8 / lg 6
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            xs 24 / sm 12 / md 8 / lg 6
          </Col>
        </Row>
      </DemoSection>
      <DemoSection title="窄屏整行">
        <Row gutter="small" class="demo-grid-row">
          <Col xs={24} md={12}>
            xs 24 / md 12
          </Col>
          <Col xs={24} md={12}>
            xs 24 / md 12
          </Col>
        </Row>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Grid 栅格 API](../exports/grid.md)
- [设计 Token](../design/tokens.md)
