# App 全局反馈 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/app/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

脱离组件树调用静态 message，五种语义各用一个按钮触发。

## 完整源码

```tsx
import { Button, message } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '脱离组件树调用静态 message，五种语义各用一个按钮触发。',
};

export default function AppBasicDemo() {
  return (
    <>
      <DemoSection title="静态短提示">
        <Button
          onClick={() => {
            message.info('普通提示');
          }}
        >
          普通提示
        </Button>
        <Button
          onClick={() => {
            message.success('操作成功');
          }}
        >
          成功提示
        </Button>
        <Button
          onClick={() => {
            message.warning('请注意风险');
          }}
        >
          警告提示
        </Button>
      </DemoSection>
      <DemoSection title="异常与加载">
        <Button
          onClick={() => {
            message.error('操作失败');
          }}
        >
          错误提示
        </Button>
        <Button
          onClick={() => {
            message.loading('加载中');
          }}
        >
          加载提示
        </Button>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [App 全局反馈 API](../exports/app.md)
- [设计 Token](../design/tokens.md)
