# Button 按钮 · 状态与图标（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/button/demos/states.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

加载 / 禁用时禁止点击；loading 同时输出 aria-busy；图标支持首尾位置。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button } from 'solid-craft';
import { DotIcon } from '../../demos/shared';

export const demo = {
  title: '状态与图标',
  description: '加载 / 禁用时禁止点击；loading 同时输出 aria-busy；图标支持首尾位置。',
};

export default function States() {
  const [loading, setLoading] = createSignal(false);
  return (
    <div class="demo-stack">
      <div class="demo-row">
        <Button disabled>禁用</Button>
        <Button loading>加载中</Button>
        <Button icon={<DotIcon />}>前置图标</Button>
        <Button icon={<DotIcon />} iconPosition="end">
          后置图标
        </Button>
      </div>
      <div class="demo-row">
        <Button loading={loading()} onClick={() => setLoading((value) => !value)}>
          {loading() ? '点击结束加载' : '点击进入加载态'}
        </Button>
      </div>
    </div>
  );
}
```

## 相关页面

- [Button 按钮 API](../exports/button.md)
- [设计 Token](../design/tokens.md)
