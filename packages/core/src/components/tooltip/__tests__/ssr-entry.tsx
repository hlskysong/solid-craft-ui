/**
 * T3-09 SSR 入口之二：`Tooltip`。
 *
 * 覆盖服务端最容易炸的形态：受控 / 非受控打开态、自定义延迟、关闭箭头、
 * 12 向里的四个方向。浮层本身由 Portal 在客户端 `useClientReady()` 后挂载，
 * 服务端**只输出触发按钮静态骨架**（与 T3-07 / T3-08 同口径）。
 *
 * 与 T3-07 一样刻意不写「浮层必须缺席」的 forbid 判据：Kobalte Portal 在
 * 服务端是空操作，那种判据恒真、破坏不了，是假判据（N62）。首帧行为由
 * `primitives/primitives.test.tsx` 的 useClientReady 断言 + browser 用例覆盖。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Tooltip } from '../Tooltip';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="tooltip-page">
      {/* 触发按钮由 `PrimitiveTooltip` 自己输出（四个），不另写同 role 的假按钮：
          否则 ssr-smoke 的 count 锚点会被无关节点污染（T3-06 踩过同类问题）。 */}
      <p>静态骨架</p>

      <Tooltip content="顶部提示" open>
        <span>受控打开</span>
      </Tooltip>

      <Tooltip content="右侧提示" placement="right-end" defaultOpen openDelay={600}>
        <span>非受控打开</span>
      </Tooltip>

      <Tooltip content="无箭头提示" placement="bottom" arrow={false}>
        <span>无箭头</span>
      </Tooltip>

      <Tooltip content="左侧提示" placement="left" closeDelay={400}>
        <span>左侧</span>
      </Tooltip>
    </div>
  ));
}
