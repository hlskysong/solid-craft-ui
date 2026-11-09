import type { JSX } from 'solid-js';

export interface IconProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'color'> {
  /**
   * 图标尺寸。
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * 语义色；不传时继承 currentColor。
   * @default undefined
   */
  tone?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'success' | 'warning' | 'danger';
  /**
   * 是否旋转。
   * @default false
   */
  spin?: boolean;
  /**
   * 无障碍标签；传入时作为 img 暴露，未传入时视为装饰图标。
   * @default undefined
   */
  label?: string;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 图标内容。
   * @default undefined
   */
  children?: JSX.Element;
}
