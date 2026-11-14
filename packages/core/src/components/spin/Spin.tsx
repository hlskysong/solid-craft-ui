/**
 * 加载指示（T3-05）。
 *
 * 两种形态共用同一套转圈内容，但**根节点各自写一遍**：独立模式的根要承接调用方的
 * class / style / 原生属性，包裹模式下这些归属外层容器、内层转圈不能再带一遍
 * （否则同一份 class 会落到两个节点上）。把 `{...(standalone ? rest : {})}`
 * 塞进一个函数里会丢掉 Solid 的响应性，重复两行根节点比那个坑便宜。
 *
 * `delay` 的实现要点：
 * - 初值**同步算出来**（`spinning && delay === 0`），不能先写 `false` 再靠 effect 打开 ——
 *   Solid 的 effect 在首次渲染之后跑，中间会有一帧「该转的没转」；
 * - 每次 `spinning` / `delay` 变化都重跑 effect，上一轮的 `onCleanup` 先清掉旧定时器，
 *   所以「延迟期内又取消」不会留下野定时器把遮罩重新打开；
 * - SSR 不执行 effect，因此服务端首帧由初值决定：`delay > 0` 时首帧无遮罩，
 *   与客户端首帧完全一致，不会 hydration 不匹配。
 *
 * 无障碍：转圈本体 `role="status"` 且**必有可读文案** —— 没传 `tip` 时输出视觉隐藏的
 * 「加载中」，否则读屏用户面对的是一段没有任何信息的旋转图形。
 */
import { createEffect, createSignal, onCleanup, Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { SpinProps } from './types';

const SPIN_PROPS = ['spinning', 'delay', 'size', 'tip', 'children', 'style', 'class'] as const;

export function Spin(props: SpinProps): JSX.Element {
  const [local, rest] = splitProps(props, SPIN_PROPS);

  const spinning = () => local.spinning ?? true;
  const delay = () => Math.max(0, local.delay ?? 0);
  const hasContent = () => local.children != null;
  const size = () => local.size ?? 'medium';

  const [visible, setVisible] = createSignal(spinning() && delay() === 0);

  createEffect(() => {
    if (!spinning()) {
      setVisible(false);
      return;
    }
    if (delay() === 0) {
      setVisible(true);
      return;
    }
    const timer = globalThis.setTimeout(() => setVisible(true), delay());
    onCleanup(() => clearTimeout(timer));
  });

  /* 只抽「转圈 + 文案」这段内容，根节点留给调用处 —— 独立与包裹两种形态的
     class / style / role 归属不同（见文件头注释）。 */
  const renderContent = (): JSX.Element => (
    <>
      <span class={`${CSS_PREFIX}spin__indicator`} aria-hidden="true" />
      <Show
        when={local.tip}
        fallback={
          /* 无文案时补一段视觉隐藏文本：转圈是纯装饰，读屏必须有个说法 */
          <span class={`${CSS_PREFIX}spin__sr`}>加载中</span>
        }
      >
        <span class={`${CSS_PREFIX}spin__tip`} data-scui-role="spin-tip">
          {local.tip}
        </span>
      </Show>
    </>
  );

  return (
    <Show
      when={hasContent()}
      fallback={
        /* 独立模式同样受 visible 控制：spinning=false 或延迟未到时必须**一次都不渲染**，
           否则「延迟期内取消」会留下一个没被移除的转圈。 */
        <Show when={visible()}>
          <div
            {...rest}
            class={classNames(`${CSS_PREFIX}spin`, local.class)}
            style={local.style}
            data-scui-role="spin"
            data-scui-size={size()}
            role="status"
          >
            {renderContent()}
          </div>
        </Show>
      }
    >
      <div
        {...rest}
        class={classNames(`${CSS_PREFIX}spin__container`, local.class)}
        style={local.style}
        data-scui-role="spin-container"
        data-scui-spinning={visible() ? '' : undefined}
        aria-busy={visible() ? 'true' : undefined}
      >
        {local.children}
        <Show when={visible()}>
          <div class={`${CSS_PREFIX}spin__overlay`} data-scui-role="spin-overlay">
            <div
              class={`${CSS_PREFIX}spin`}
              data-scui-role="spin"
              data-scui-size={size()}
              role="status"
            >
              {renderContent()}
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
}
