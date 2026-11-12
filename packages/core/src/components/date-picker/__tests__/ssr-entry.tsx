/**
 * T2-10 SSR 入口：验「服务端只输出输入框骨架 + 状态属性两态稳定，且不取当前时间」。
 *
 * 日历弹层只在客户端 `open()` 后挂载，服务端必须缺席：若有人把 `Show when={open()}`
 * 改成恒真，这里会多出 `data-scui-role="calendar"` / `data-scui-day` 并被 counts 抓到。
 *
 * 三个实例分别覆盖：默认 / 受控+清除+格式 / error+disabled。
 * 断言里刻意不含「今天」——服务端一旦读系统时间，双渲比对与不同日期跑 CI 都会翻车。
 */
import { renderToString } from 'solid-js/web';

import { DatePicker } from '../DatePicker';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <DatePicker aria-label="日期" />
      <DatePicker
        value="2026-03-15"
        allowClear
        format="YYYY年M月D日"
        size="small"
        aria-label="签署日期"
      />
      <DatePicker min="2026-03-10" max="2026-03-20" status="error" disabled aria-label="禁用日期" />
    </div>
  ));
}
