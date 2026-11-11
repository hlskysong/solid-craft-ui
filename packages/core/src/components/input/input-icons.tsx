/**
 * 输入类控件内部使用的小图标。
 *
 * 不走 `solid-craft-icons` 包：那是给业务方用的可选图标集，组件自身不应依赖它
 * （否则 `solid-craft/input` 会拖进整个图标包）。尺寸与颜色跟随 `currentColor`，
 * 统一 `aria-hidden`，语义由按钮的 `aria-label` 承担。
 */
import type { JSX } from 'solid-js';

const SIZE = 16;

/** 清除按钮图标（实心圆底 + 叉）。 */
export function ClearIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width={SIZE} height={SIZE} aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.35" />
      <path
        d="M5.6 5.6 10.4 10.4M10.4 5.6 5.6 10.4"
        stroke="var(--scui-color-bg-surface)"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </svg>
  );
}

/** 显示密码图标。 */
export function EyeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width={SIZE} height={SIZE} aria-hidden="true">
      <path
        d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

/** 隐藏密码图标（眼罩式斜线）。 */
export function EyeOffIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width={SIZE} height={SIZE} aria-hidden="true">
      <path
        d="M2.5 3.5 13.5 12.5"
        stroke="currentColor"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <path
        d="M1.5 8S4 3.5 8 3.5c1 0 1.9.27 2.7.68M14.5 8s-2.5 4.5-6.5 4.5c-1 0-1.9-.27-2.7-.68"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
      />
    </svg>
  );
}

/** 搜索按钮图标。 */
export function SearchIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width={SIZE} height={SIZE} aria-hidden="true">
      <circle cx="7" cy="7" r="4.2" fill="none" stroke="currentColor" stroke-width="1.4" />
      <path
        d="M10.2 10.2 13.5 13.5"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </svg>
  );
}
