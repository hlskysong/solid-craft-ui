import type { JSX } from 'solid-js';

export interface DividerProps {
  /**
   * 分割线方向。
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * 是否使用虚线。
   * @default false
   */
  dashed?: boolean;
  /**
   * 文字是否使用普通字重。
   * @default false
   */
  plain?: boolean;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 分割线文字。
   * @default undefined
   */
  children?: JSX.Element;
}
