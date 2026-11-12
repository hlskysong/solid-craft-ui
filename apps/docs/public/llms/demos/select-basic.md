# Select 选择器 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/select/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

非受控与受控两种取值方式，以及三档尺寸。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Select } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

const cities = [
  { value: 'sjz', label: '石家庄' },
  { value: 'hd', label: '邯郸' },
  { value: 'ts', label: '唐山' },
  { value: 'bd', label: '保定' },
  { value: 'qhd', label: '秦皇岛', disabled: true },
];

export const demo = {
  title: '基础用法',
  description: '非受控与受控两种取值方式，以及三档尺寸。',
};

export default function BasicDemo() {
  const [pickedCity, setPickedCity] = createSignal('sjz');
  const [city, setCity] = createSignal('hd');

  return (
    <>
      <DemoSection title="非受控与受控">
        <Select
          options={cities}
          defaultValue="sjz"
          onChange={(value) => setPickedCity(value)}
          aria-label="城市（非受控）"
        />
        <span>
          当前值：<output>{pickedCity() === '' ? '（空）' : pickedCity()}</output>
        </span>
        <Select
          options={cities}
          value={city()}
          onChange={(value) => setCity(value)}
          aria-label="城市（受控）"
        />
        <span>
          当前值：<output>{city() === '' ? '（空）' : city()}</output>
        </span>
      </DemoSection>

      <DemoSection title="尺寸">
        <Select options={cities} size="small" defaultValue="sjz" aria-label="small 尺寸" />
        <Select options={cities} size="medium" defaultValue="hd" aria-label="medium 尺寸" />
        <Select options={cities} size="large" defaultValue="ts" aria-label="large 尺寸" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Select 选择器 API](../exports/select.md)
- [设计 Token](../design/tokens.md)
