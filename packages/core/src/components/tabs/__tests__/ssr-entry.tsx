/**
 * T3-11 SSR 入口之一：`Tabs`。
 *
 * 只断言**正面的静态骨架**：页面容器、tablist、四个 tab、激活态双通道、
 * `data-scui-variant`、以及 `lazy={false}` 下三个 tabpanel 全部输出。不写
 * 「未激活 panel 必须缺席」的 forbid 判据 —— Kobalte 的 presence 在服务端
 * 由 Show 决定，恒真的 forbid 是假判据（N62 教训）。
 *
 * 两个 Tabs 分别覆盖：默认线型 + 禁用项、卡片 + 全量挂载；全部在 setup 期
 * 产出，不访问 `window` / `document` / 当前时间。
 */
import { renderToString } from 'solid-js/web';

import { Tabs } from '../Tabs';

const items = [
  { key: 'plan', label: '计划概览', content: () => <span>年度计划共 12 条</span> },
  { key: 'detail', label: '明细清单', content: () => <span>主通风机 2 台</span> },
  { key: 'audit', label: '审批记录', content: () => <span>复核通过</span> },
];

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="tabs-page">
      <button type="button" data-scui-role="tabs-trigger">
        打开标签页
      </button>
      <Tabs items={items} aria-label="采购计划分区" />
      <Tabs items={items} variant="card" lazy={false} aria-label="卡片分区" />
    </div>
  ));
}
