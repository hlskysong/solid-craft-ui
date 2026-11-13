/**
 * T3-04 SSR 入口：验「分页在服务端就是完整静态结构」。
 *
 * 五个实例分别覆盖：① 基础（9 页，7 槽窗口 + 1 个省略号）；② 受控越界
 * （`current=99` 必须收敛到第 10 页，服务端就吐 `aria-current` 在末页）；
 * ③ 完整组合（每页条数下拉的 `selected`、跳转输入框、总数文案）；
 * ④ 整体禁用；⑤ `total = 0`（仍有一页、上下页全禁用）。
 *
 * 首帧要断言的关键点：`aria-current="page"` 与 `selected` 都是 **attribute**，
 * SSR 直接输出 —— 若改用 `<select value>` 这类非标准属性，服务端会输出成
 * 无意义属性、浏览器仍选第一项，首帧与客户端不一致。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Pagination } from '../Pagination';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Pagination total={85} aria-label="基础分页" />

      <Pagination total={95} current={99} aria-label="受控越界，应收敛到末页" />

      <Pagination
        total={500}
        defaultCurrent={5}
        showSizeChanger
        showQuickJumper
        showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`}
        aria-label="完整组合"
      />

      <Pagination
        total={500}
        defaultCurrent={2}
        showSizeChanger
        showQuickJumper
        disabled
        aria-label="禁用分页"
      />

      <Pagination total={0} aria-label="空数据" />
    </div>
  ));
}
