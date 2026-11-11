/**
 * 原语层 SSR 入口（T2-01）。
 *
 * 只被 `packages/core/spikes/shared/ssr-smoke.mjs` 通过 Vite `ssrLoadModule`
 * 以服务端条件加载 —— 因此放在 `__tests__/` 下：
 * `collect-sources.mjs` 与 `tsconfig.build.json` 都会排除该目录，
 * 原语层的 SSR 入口不会进 `dist` / npm 包，但会被 `pnpm typecheck` 检查。
 */
import { renderToString } from 'solid-js/web';

import { PrimitiveDialog } from '../dialog';
import { PrimitiveSelect } from '../select';
import type { PrimitiveOption } from '../types';

const options: PrimitiveOption[] = [
  { value: 'shijiazhuang', label: '石家庄' },
  { value: 'handan', label: '邯郸' },
  { value: 'tangshan', label: '唐山', disabled: true },
];

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <PrimitiveSelect options={options} aria-label="城市" />
      <PrimitiveDialog trigger="打开设置" title="设置">
        原语层内容
      </PrimitiveDialog>
    </div>
  ));
}
