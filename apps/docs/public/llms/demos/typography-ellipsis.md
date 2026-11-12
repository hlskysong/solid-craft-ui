# Typography 排版 · 超长文本（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/typography/demos/ellipsis.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

窄容器下的单行省略与换行，以及 ellipsis 与普通文本的对比。

## 完整源码

```tsx
import { Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '超长文本',
  description: '窄容器下的单行省略与换行，以及 ellipsis 与普通文本的对比。',
};

const LONG = '冀中能源集团设备维检计划管理平台设备名称与型号采购数量本次采购单价合计金额';

export default function Ellipsis() {
  return (
    <>
      <DemoSection title="单行省略（容器 240px）">
        <div class="demo-stack" style={{ 'max-width': '240px' }}>
          <Text ellipsis>{LONG}</Text>
          <Text ellipsis tone="secondary">
            {`${LONG}（含运费与安装调试费用）`}
          </Text>
        </div>
      </DemoSection>
      <DemoSection title="不省略会换行">
        <div class="demo-stack" style={{ 'max-width': '240px' }}>
          <Text>{LONG}</Text>
        </div>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Typography 排版 API](../exports/typography.md)
- [设计 Token](../design/tokens.md)
