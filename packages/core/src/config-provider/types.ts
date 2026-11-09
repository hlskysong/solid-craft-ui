import type { Accessor, JSX } from 'solid-js';
import type { MaybeAccessor } from '../utils/resolve-value';

/** 主题名称；`system` 会在客户端按系统偏好解析为 `light` / `dark`。 */
export type ThemeName = 'light' | 'dark' | 'system';

/** 界面密度。 */
export type Density = 'default' | 'compact';

/** 文字与布局方向。 */
export type Direction = 'ltr' | 'rtl';

export interface ConfigProviderProps {
  /**
   * 语言标识。
   * @default 'zh-CN'
   */
  locale?: MaybeAccessor<string>;
  /**
   * 主题；`system` 仅在客户端跟随系统偏好。
   * @default 'light'
   */
  theme?: MaybeAccessor<ThemeName>;
  /**
   * 界面密度。
   * @default 'default'
   */
  density?: MaybeAccessor<Density>;
  /**
   * 文字与布局方向。
   * @default 'ltr'
   */
  direction?: MaybeAccessor<Direction>;
  /**
   * 浮层 z-index 的基础值，组件通过 CSS 变量叠加偏移量。
   * @default 0
   */
  zIndexBase?: MaybeAccessor<number>;
  /**
   * 浮层挂载容器；未提供时懒加载为 `document.body`。
   * @default undefined
   */
  portalContainer?: MaybeAccessor<HTMLElement | undefined>;
  /**
   * 主题作用目标；`local` 写到包裹元素，`global` 写到 `document.documentElement`。
   * @default 'local'
   */
  themeTarget?: MaybeAccessor<'global' | 'local'>;
  /**
   * 包裹元素的自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 子树内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface UIConfig {
  /** 当前语言标识。 */
  locale: Accessor<string>;
  /** 当前主题；`system` 已在客户端解析为 `light` / `dark`，服务端一律为 `light`。 */
  theme: Accessor<ThemeName>;
  /** 当前界面密度。 */
  density: Accessor<Density>;
  /** 当前文字与布局方向。 */
  direction: Accessor<Direction>;
  /** 当前浮层 z-index 基础值。 */
  zIndexBase: Accessor<number>;
  /** 当前浮层挂载容器；调用时才解析默认值。 */
  portalContainer: Accessor<HTMLElement | undefined>;
}
