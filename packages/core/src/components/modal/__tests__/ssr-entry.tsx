/**
 * T3-07 SSR 入口：`Modal`。
 *
 * 覆盖两个「服务端最容易炸」的形态：① 受控 `open=true`（业务侧在 SSR 时就把
 * 打开态传下来）；② `defaultOpen` + `confirmLoading` 的异步态。两者都必须只输出
 * 静态页面骨架，不得在渲染期访问 `document` / `window`。
 *
 * **刻意不写「弹层必须缺席」的 forbid 判据**：ssr-smoke.mjs 头部已记录
 * T2-01 实测 —— 即便把 `useClientReady` 改成恒 true，Kobalte 的 Portal
 * 在服务端构建下依然是空操作、SSR 输出不含任何弹层节点。那种判据恒真、
 * 破坏不了，是假判据（负向实证 N62）。「首帧不挂弹层」由
 * `src/primitives/primitives.test.tsx` 的 useClientReady 首帧断言覆盖，
 * 弹层真实挂载由 browser 用例覆盖。
 *
 * 因此这里断言的是**正面的静态骨架**：页面容器与触发按钮必须真实输出，
 * 且两次 renderToString 逐字一致（由 runner 统一校验）。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Modal } from '../Modal';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="modal-page">
      <button type="button" data-scui-role="modal-trigger">
        打开对话框
      </button>

      <Modal title="采购计划确认" open>
        <p>确认后进入审批流。</p>
      </Modal>

      <Modal title="异步确认" defaultOpen confirmLoading>
        <p>正在提交。</p>
      </Modal>
    </div>
  ));
}
