/**
 * `InputNumber` 的 SSR 入口（T2-04）。
 *
 * 与 `ssr-entry.tsx`（Input / Textarea）分开，是因为两者的 `counts` 判据互不干扰：
 * 同一个文件里混渲会让「出现几次」的断言失去诊断价值（少一个也说不清是谁少的）。
 *
 * 服务端能验的部分：壳与按钮的 `data-scui-*` 契约、千分位格式化结果、
 * 到界按钮的 `disabled` 属性。草稿态与步进都发生在客户端，不进这里。
 */
import { renderToString } from 'solid-js/web';

import { InputNumber } from '../InputNumber';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div>
      <InputNumber aria-label="数量" defaultValue={12.5} step={0.5} suffix="件" />
      <InputNumber aria-label="金额" defaultValue={1234567} thousands precision={0} />
      <InputNumber aria-label="禁用" defaultValue={3} size="large" disabled />
      {/* 到顶：max=10 且值已是 10，服务端就应输出 disabled 的增加按钮。 */}
      <InputNumber aria-label="到顶" defaultValue={10} min={0} max={10} />
    </div>
  ));
}
