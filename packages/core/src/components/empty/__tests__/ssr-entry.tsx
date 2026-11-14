/**
 * T3-05 SSR 入口之一：`Empty`。
 *
 * 四个实例覆盖：① 全默认（内置插画 + 默认文案）；② 小尺寸自定义文案；
 * ③ `image={null}` 的纯文字形态（插画块必须整块消失，不是渲染成空盒子）；
 * ④ 自定义插画 + 操作区。
 *
 * 首帧要断言的关键点：内置 SVG 的 `aria-hidden="true"` 是 attribute，SSR 直接输出；
 * `image={null}` 时 `empty-image` 在输出里**一次都不出现**。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Empty } from '../Empty';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Empty />

      <Empty size="small" description="暂无采购计划" />

      <Empty size="large" image={null} description="这一列暂时没有数据" />

      <Empty image={<span class="art">✓</span>} description="全部处理完了">
        <button type="button">查看归档</button>
      </Empty>
    </div>
  ));
}
