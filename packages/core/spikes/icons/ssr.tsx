/**
 * T4-17 图标包 SSR 入口：验证精选图标（由 lucide-solid 构建期生成）在服务端
 * 能输出完整 SVG，且 size / strokeWidth 覆盖与 currentColor 都落到真实属性上。
 *
 * 图标是纯静态模板（Solid template() 编译），不碰 Client-only API，服务端应零报错。
 * markers 用完整属性片段，counts 锁住两个 SVG 的根输出，避免只渲一个也能兜住假绿。
 */
import { renderToString } from 'solid-js/web';

import { CircleCheck, Search, Settings } from 'solid-craft-icons';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-scui-role="icons-page">
      <CircleCheck />
      <Search size={20} strokeWidth={2} />
      <Settings class="icon-settings" />
    </div>
  ));
}
