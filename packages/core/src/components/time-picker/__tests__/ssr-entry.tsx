/**
 * T4-13 SSR 入口：验「服务端只输出输入框骨架 + 状态属性两态稳定」。
 *
 * 时间列只在客户端 `open()` 后挂载，服务端必须缺席：若有人把 `Show when={open()}`
 * 改成恒真，这里会多出 `data-scui-role="time-panel"`，被 counts 抓到。
 */
import { renderToString } from 'solid-js/web';

import { TimePicker } from '../TimePicker';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <TimePicker aria-label="时间" />
      <TimePicker
        value="14:05:30"
        showSeconds
        hour12
        format="A HH:mm:ss"
        allowClear
        size="small"
        aria-label="会议时间"
      />
      <TimePicker min="08:00" max="18:00" status="error" disabled aria-label="禁用时间" />
    </div>
  ));
}
