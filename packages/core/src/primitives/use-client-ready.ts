import { createSignal, onMount, type Accessor } from 'solid-js';
import { isServer } from 'solid-js/web';

/**
 * 客户端就绪信号：服务端与客户端首帧均为 `false`，挂载后置为 `true`。
 *
 * 用途是「渐进增强」而不是「规避 SSR」：组件库必须 SSR 可用（`docs/02 §8`），
 * 但弹层 / 浮层这类必须依赖 `document`、布局测量与焦点管理的部分，
 * 服务端只能输出静态骨架。这里给出统一的开关，避免每个原语各写一套 `isServer` 判断。
 *
 * 为什么首帧也返回 `false`（而不是直接 `!isServer`）：
 * 服务端输出的是骨架，客户端首帧必须也输出骨架才能 hydration 对齐；
 * 若客户端首帧就渲染真实弹层，`renderToString` 与首次 `render` 的 DOM 结构不一致，
 * 会触发 hydration mismatch。`onMount` 之后切换是 Solid 下两阶段渲染的标准做法。
 *
 * @returns 只读信号；`true` 表示已挂载、可安全访问浏览器 API
 */
export function useClientReady(): Accessor<boolean> {
  const [ready, setReady] = createSignal(false);

  if (!isServer) {
    onMount(() => setReady(true));
  }

  return ready;
}
