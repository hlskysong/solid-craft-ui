/**
 * T3-09 SSR 入口之一：`Alert` + 全局反馈接入。
 *
 * 与 T3-07 / T3-08 同口径：断言**正面的静态骨架**（页面容器、触发按钮、四种
 * `data-scui-kind` 恒输出），不写「反馈条必须缺席」之类的 forbid 假判据。
 *
 * 关键在 `FeedbackProbe`：服务端**真的调用** T2-06 的静态 `message.success()`
 * 与 `useApp().message.info()`。T2-06 的 SSR 边界是 `isServer` + 惰性挂载，
 * 服务端返回已 resolve 的 no-op 句柄；这里删掉任一调用都不该报错，但一旦
 * 反馈通道被误改成「顶层访问 document」，本入口会立刻抛
 *「Client-only API called on the server side」（T2-06 N90 同款实证）。
 * 这就是 §4.2「全局反馈能脱离树调用且 SSR 不报错」在本轮的接入实证。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import type { JSX } from 'solid-js';
import { renderToString } from 'solid-js/web';

import { message, useApp } from '../../app';
import { Alert } from '../Alert';

function FeedbackProbe(): JSX.Element {
  const app = useApp();
  void message.success('服务端静态通道调用');
  void app.message.info('服务端上下文回落调用');
  return <p>静态反馈接入探针</p>;
}

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="alert-page">
      <button type="button" data-scui-role="alert-trigger">
        打开提示
      </button>

      <Alert title="填报说明" description="请填写本次采购数量。" />
      <Alert kind="success" title="保存成功" description="明细已写入草稿。" />
      <Alert kind="warning" title="金额超出预算" closable={false} />
      <Alert kind="error" title="提交失败" icon={null} />

      <FeedbackProbe />
    </div>
  ));
}
