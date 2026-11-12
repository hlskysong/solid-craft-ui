# Select 选择器 · 搜索与清除（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/select/demos/search.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

开启本地搜索按选项文案过滤，开启清除后可一键清空已选值。

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
  { value: 'qhd', label: '秦皇岛' },
];

export const demo = {
  title: '搜索与清除',
  description: '开启本地搜索按选项文案过滤，开启清除后可一键清空已选值。',
};

export default function SearchDemo() {
  const [searched, setSearched] = createSignal('');
  const [cleared, setCleared] = createSignal('ts');

  return (
    <>
      <DemoSection title="本地搜索">
        <Select
          options={cities}
          searchable
          clearable
          placeholder="请选择城市"
          searchPlaceholder="搜索城市"
          clearLabel="清除已选城市"
          emptyText="没有匹配的城市"
          onChange={(value) => setSearched(value)}
          aria-label="可搜索的城市"
        />
        <span>
          当前选中：<output>{searched() === '' ? '（未选择）' : searched()}</output>
        </span>
      </DemoSection>

      <DemoSection title="带默认值可清除">
        <Select
          options={cities}
          defaultValue="ts"
          clearable
          placeholder="请选择城市"
          clearLabel="清除已选城市"
          onChange={(value) => setCleared(value)}
          aria-label="可清除的城市"
        />
        <span>
          当前选中：<output>{cleared() === '' ? '（已清空）' : cleared()}</output>
        </span>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Select 选择器 API](../exports/select.md)
- [设计 Token](../design/tokens.md)
