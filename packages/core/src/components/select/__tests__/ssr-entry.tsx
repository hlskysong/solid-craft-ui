/**
 * T2-07 SSR 入口：验「服务端只输出触发器静态骨架 + 状态属性两态稳定」。
 *
 * 弹层（搜索框 / 空态 / 加载提示）由原语的 `useClientReady()` 在 onMount 后才装载，
 * 服务端与客户端首帧都必须缺席；若有人把 `Show when={ready()}` 改成恒真，
 * 这里会多出 `data-scui-role="select-search"` / `select-empty` 并被 counts 抓到。
 *
 * 四个实例分别覆盖：默认 / 受控+清除+搜索 / loading+error / disabled。
 */
import { renderToString } from 'solid-js/web';

import { Select } from '../Select';
import type { SelectOption } from '../types';

const cities: SelectOption[] = [
  { value: 'sjz', label: '石家庄' },
  { value: 'hd', label: '邯郸' },
  { value: 'ts', label: '唐山', disabled: true },
];

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Select options={cities} aria-label="城市" />
      <Select
        options={cities}
        value="hd"
        clearable
        searchable
        size="small"
        aria-label="城市小尺寸"
      />
      <Select options={[]} loading status="error" size="large" aria-label="城市加载中" />
      <Select options={cities} disabled aria-label="城市禁用" />
    </div>
  ));
}
