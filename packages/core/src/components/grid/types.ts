import type { JSX } from 'solid-js';

export interface RowProps {
  /**
   * 栅格间距尺寸。
   * @default 'medium'
   */
  gutter?: 'small' | 'medium' | 'large';
  /**
   * 交叉轴对齐方式。
   * @default undefined
   */
  align?: 'top' | 'middle' | 'bottom';
  /**
   * 主轴对齐方式。
   * @default undefined
   */
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  /**
   * 是否换行。
   * @default true
   */
  wrap?: boolean;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 栅格内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface ColProps {
  /**
   * 栅格占位列数（1–24）。
   * @default 24
   */
  span?: number;
  /**
   * 左侧偏移列数。
   * @default 0
   */
  offset?: number;
  /**
   * 排列顺序。
   * @default 0
   */
  order?: number;
  /**
   * xs 断点下的占位列数。
   * @default undefined
   */
  xs?: number;
  /**
   * sm 断点下的占位列数。
   * @default undefined
   */
  sm?: number;
  /**
   * md 断点下的占位列数。
   * @default undefined
   */
  md?: number;
  /**
   * lg 断点下的占位列数。
   * @default undefined
   */
  lg?: number;
  /**
   * xl 断点下的占位列数。
   * @default undefined
   */
  xl?: number;
  /**
   * xxl 断点下的占位列数。
   * @default undefined
   */
  xxl?: number;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 栅格内容。
   * @default undefined
   */
  children?: JSX.Element;
}
