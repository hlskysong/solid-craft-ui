import type { JSX } from 'solid-js';
import type { MaybeAccessor } from '../../utils/resolve-value';

export interface LayoutProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'class' | 'children'
> {
  /**
   * 是否包含侧边栏，包含时布局改为水平排列。
   * @default false
   */
  hasSider?: boolean;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 布局内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface HeaderProps {
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 头部内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface ContentProps {
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 内容区内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface FooterProps {
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 底部内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface SiderProps {
  /**
   * 是否折叠；传入后为受控模式。
   * @default undefined
   */
  collapsed?: MaybeAccessor<boolean>;
  /**
   * 非受控模式下的初始折叠状态。
   * @default false
   */
  defaultCollapsed?: boolean;
  /**
   * 是否显示折叠触发器。
   * @default false
   */
  collapsible?: boolean;
  /**
   * 展开时的宽度（px）。
   * @default 200
   */
  width?: number;
  /**
   * 折叠时的宽度（px）。
   * @default 64
   */
  collapsedWidth?: number;
  /**
   * 折叠状态变化时的回调。
   * @default undefined
   */
  onCollapse?: (collapsed: boolean) => void;
  /**
   * 自定义折叠触发器内容。
   * @default undefined
   */
  trigger?: JSX.Element;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 侧边栏内容。
   * @default undefined
   */
  children?: JSX.Element;
}
