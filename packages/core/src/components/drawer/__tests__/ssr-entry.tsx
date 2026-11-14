/**
 * T3-08 SSR 入口：`Drawer`。
 *
 * 覆盖服务端最容易炸的三种形态：① 受控 `open=true` 的左右抽屉；
 * ② `defaultOpen` + `placement="top"` 的非受控态；③ 带显式 `height` 的
 * bottom 抽屉（尺寸归一在渲染期就要算出内联自定义属性）。四方向都必须只输出
 * 静态页面骨架，不得在渲染期访问 `document` / `window`。
 *
 * 与 T3-07 同口径：**刻意不写「弹层必须缺席」的 forbid 判据** —— ssr-smoke.mjs
 * 头部已记录 T2-01 实测（N62）：即便把 `useClientReady` 改成恒 true，Kobalte
 * 的 Portal 在服务端构建下依然是空操作，那种判据恒真、破坏不了，是假判据。
 * 「首帧不挂弹层」由 `src/primitives/primitives.test.tsx` 的 useClientReady
 * 首帧断言覆盖，弹层真实挂载由 browser 用例覆盖。
 *
 * 因此这里断言的是**正面的静态骨架**：页面容器与触发按钮必须真实输出，
 * 且两次 renderToString 逐字一致（由 runner 统一校验）。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Drawer } from '../Drawer';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="drawer-page">
      <button type="button" data-scui-role="drawer-trigger">
        打开抽屉
      </button>

      <Drawer title="采购计划明细" open>
        <p>按年度维简计划登记本次采购明细。</p>
      </Drawer>

      <Drawer title="顶部抽屉" defaultOpen placement="top">
        <p>顶部贴边的静态骨架。</p>
      </Drawer>

      <Drawer title="底部抽屉" open placement="bottom" height={320}>
        <p>显式高度在服务端也要算进内联自定义属性。</p>
      </Drawer>
    </div>
  ));
}
