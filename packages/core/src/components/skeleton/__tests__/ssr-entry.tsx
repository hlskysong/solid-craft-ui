/**
 * T3-05 SSR 入口之一：`Skeleton`。
 *
 * 覆盖：① 默认三行段落；② 表格形状（表头 + 2 行，每行 3 列）；
 * ③ 卡片形状；④ 头像；⑤ 包裹模式但 `loading=false`（服务端应直接出真实内容，
 * 不能先吐骨架 —— 否则首帧闪一下再换成内容）。
 *
 * 首帧关键点：`aria-busy="true"` 是 attribute；骨架条数量必须与 `rows` 一致；
 * 末行只有一处 `data-scui-last`。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Skeleton } from '../Skeleton';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Skeleton />

      <Skeleton variant="table" rows={2} />

      <Skeleton variant="card" rows={2} active />

      <Skeleton variant="avatar" />

      <Skeleton loading={false}>
        <p>服务端直出真实内容</p>
      </Skeleton>
    </div>
  ));
}
