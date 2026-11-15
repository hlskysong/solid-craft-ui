/**
 * T3-10 SSR 入口之一：`Card`。
 *
 * 与 T3-09 同口径：只断言**正面的静态骨架**（页面容器、触发按钮、四块结构、
 * `data-scui-loading` 与 Skeleton 的 SSR 输出），不写「loading 时正文必须缺席」
 * 之类的 forbid 假判据 —— 那在 Solid 的服务端渲染里是恒真的。
 *
 * 三张卡片分别覆盖：标题 + 操作区、封面 + 加载态、纯内容（表头整块缺席）。
 * 全部在 setup 期产出，不访问 `window` / `document` / 当前时间。
 */
import { renderToString } from 'solid-js/web';

import { Card } from '../Card';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="card-page">
      <button type="button" data-scui-role="card-trigger">
        打开卡片
      </button>

      <Card title="采购计划" extra={<span>共 12 条</span>}>
        年度维简设备采购明细。
      </Card>
      <Card cover={<span>静态封面</span>} title="主通风机" extra={<span>加载中</span>} loading>
        这段正文在服务端不该出现。
      </Card>
      <Card>纯内容卡片</Card>
    </div>
  ));
}
