import type { JSX } from 'solid-js';

export interface SpaceProps {
  /**
   * 排列方向。
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * 间距尺寸。
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * 是否换行。
   * @default false
   */
  wrap?: boolean;
  /**
   * 交叉轴对齐方式。
   * @default undefined
   */
  align?: 'start' | 'center' | 'end' | 'baseline';
  /**
   * 子项之间的分隔内容。
   * @default undefined
   */
  split?: JSX.Element;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 子项内容。
   * @default undefined
   */
  children?: JSX.Element;
}
