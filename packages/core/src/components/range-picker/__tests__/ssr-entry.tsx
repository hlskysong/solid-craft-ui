/**
 * T2-11 SSR 入口：验「服务端只输出两个输入框骨架 + 状态属性两态稳定，且不取当前时间」。
 *
 * 日历弹层只在客户端 `open()` 后挂载，服务端必须缺席：若有人把 `Show when={open()}`
 * 改成恒真，这里会多出 `range-calendar` / `range-popup` / `data-scui-day` 并被 counts 抓到。
 *
 * 三个实例分别覆盖：默认 / 受控+清除+格式 / error+disabled。
 * 断言里刻意不含「今天」与任何实际日期以外的时态文案 —— 区间控件根本没有「今天」按钮，
 * 服务端一旦读系统时间，双渲比对与不同日期跑 CI 都会翻车。
 */
import { renderToString } from 'solid-js/web';

import { RangePicker } from '../RangePicker';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <RangePicker aria-label="日期范围" />
      <RangePicker
        value={['2026-03-15', '2026-04-02']}
        allowClear
        format="YYYY年M月D日"
        size="small"
        aria-label="合同期限"
      />
      <RangePicker
        min="2026-03-10"
        max="2026-03-20"
        status="error"
        disabled
        aria-label="禁用范围"
      />
    </div>
  ));
}
