/**
 * T3-11 SSR 入口之二：`Descriptions`。
 *
 * 只断言**正面的静态骨架**：页面容器、dl / dt / dd 语义、三档 column、
 * span 与 bordered 的恒输出、表头按内容缺席。不写 forbid 假判据。
 *
 * 三张 Descriptions 分别覆盖：标题 + 操作区 + 跨列、三列 + 边框、纯列表
 * （表头整块缺席）。全部在 setup 期产出，不访问 `window` / `document`。
 */
import { renderToString } from 'solid-js/web';

import { Descriptions } from '../Descriptions';

const items = [
  { key: 'no', label: '项目编号', children: 'WJ-2026-012' },
  { key: 'name', label: '项目名称', children: '主通风机更新改造' },
  { key: 'note', label: '备注', children: '含安装与调试', span: 2 as const },
];

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="descriptions-page">
      <button type="button" data-scui-role="descriptions-trigger">
        打开详情
      </button>
      <Descriptions items={items} title="采购计划详情" extra={<span>共 3 项</span>} />
      <Descriptions items={items} column={3} bordered />
      <Descriptions items={items} column={1} />
    </div>
  ));
}
