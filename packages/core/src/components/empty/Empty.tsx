/**
 * 空状态（T3-05）。
 *
 * 结构极简：一块插画 + 一句描述 + 可选操作区。之所以单独成一个组件而不是让
 * 业务各写一段 div，是因为 `Table` / `List` / `Select` 的「无数据」占位必须长得一样，
 * 且要能被 `check:ci` 认出是同一个占位（T3-06 的 Table 空态直接复用它）。
 *
 * 无障碍：内置插画是纯装饰，`aria-hidden="true"`；描述文案是普通文本节点，
 * 不加 `role="status"` —— 空状态是页面静态内容，
 * 加 live region 会让读屏在每次路由切换时重复播报「暂无数据」。
 *
 * 自定义插画整体替换内置图形（不是叠加），调用方要对它的可读性负责：
 * 装饰性图形请自行加 `aria-hidden`。
 */
import { Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { EmptyProps } from './types';

const EMPTY_PROPS = ['description', 'image', 'size', 'children', 'style', 'class'] as const;

/**
 * 内置插画：虚线圆角框 + 两条短横线。
 *
 * 刻意不用彩色插画集：设计系统里没有任何位图资源，内联 SVG 用 `currentColor`
 * 描边才能同时适配浅色 / 深色主题，也不会给包体增加字体或图片依赖。
 *
 * 不输出 `focusable="false"`：那是 IE 时代的 SVG 专用属性，`chrome >= 128` 下
 * 无任何作用，且不在 Solid 的 SVG 属性类型里。
 */
function DefaultImage(): JSX.Element {
  return (
    <svg viewBox="0 0 96 72" fill="none" aria-hidden="true" class={`${CSS_PREFIX}empty__svg`}>
      <rect
        x="16"
        y="14"
        width="64"
        height="44"
        rx="6"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-dasharray="6 5"
      />
      <path
        d="M36 34h24M36 43h16"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function Empty(props: EmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, EMPTY_PROPS);

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}empty`, local.class)}
      style={local.style}
      data-scui-role="empty"
      data-scui-size={local.size ?? 'medium'}
    >
      {/* `image` 传 null 表示「不要插画」（纯文字空状态），不传才走内置图形；
          插画块一并省掉，不留一个 96px 的空盒子 */}
      <Show when={local.image !== null}>
        <div class={`${CSS_PREFIX}empty__image`} data-scui-role="empty-image">
          {local.image ?? <DefaultImage />}
        </div>
      </Show>
      <div class={`${CSS_PREFIX}empty__description`} data-scui-role="empty-description">
        {local.description ?? '暂无数据'}
      </div>
      {/* 操作区按需渲染：不传 children 时不留空 div，避免布局里多一层无语义盒子 */}
      <Show when={local.children}>
        <div class={`${CSS_PREFIX}empty__footer`} data-scui-role="empty-footer">
          {local.children}
        </div>
      </Show>
    </div>
  );
}
