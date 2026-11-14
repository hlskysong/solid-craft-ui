/**
 * T3-09 SSR 入口之三：`Popconfirm`。
 *
 * 覆盖服务端最容易炸的形态：受控 / 非受控打开态、异步 `onOk` 回调（渲染期
 * 不得执行）、四向 placement、自定义文案与关闭箭头。浮层由 Portal 在客户端
 * `useClientReady()` 后挂载，服务端**只输出触发按钮静态骨架**。
 *
 * 与 T3-07 / T3-08 同口径：只断言正面静态骨架，不写「浮层必须缺席」的
 * forbid 假判据（Kobalte Portal 在服务端恒空操作，N62）。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Popconfirm } from '../Popconfirm';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="popconfirm-page">
      {/* 触发按钮由 `PrimitivePopover` 自己输出（四个），不另写同 role 的假按钮。 */}
      <p>静态骨架</p>

      <Popconfirm title="确认删除？" description="删除后不可恢复" open>
        删除
      </Popconfirm>

      <Popconfirm title="确认归档？" placement="bottom-end" defaultOpen arrow={false}>
        归档
      </Popconfirm>

      <Popconfirm
        title="异步提交"
        placement="left"
        okText="提交"
        cancelText="返回"
        onOk={() => Promise.resolve()}
      >
        提交
      </Popconfirm>

      <Popconfirm title="右侧确认" placement="right">
        右侧
      </Popconfirm>
    </div>
  ));
}
