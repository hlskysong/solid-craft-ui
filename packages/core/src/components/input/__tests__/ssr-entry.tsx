/**
 * `Input` / `Textarea` 的 SSR 入口（T2-03）。
 *
 * 只被 `packages/core/spikes/shared/ssr-smoke.mjs` 通过 Vite `ssrLoadModule`
 * 以服务端条件加载 —— 放在 `__tests__/` 下是因为 `collect-sources.mjs` 与
 * `tsconfig.build.json` 都排除该目录：不进 `dist` / npm 包，但会被 `pnpm typecheck` 检查。
 *
 * 验的是服务端能渲染出的部分：壳、控件、`data-scui-*` 契约、内联值。
 * 自动高度不进 SSR（`createEffect` 在服务端不跑，也没有布局可测），
 * 服务端高度由 `rows` 决定。
 */
import { renderToString } from 'solid-js/web';

import { Input } from '../Input';
import { Textarea } from '../Textarea';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div>
      <Input defaultValue="服务端值" allowClear />
      <Input type="search" defaultValue="关键字" enterButton onSearch={() => {}} />
      <Input type="password" defaultValue="secret" />
      <Textarea
        defaultValue="多行内容"
        autoSize={{ minRows: 3, maxRows: 6 }}
        showCount
        maxLength={20}
      />
    </div>
  ));
}
