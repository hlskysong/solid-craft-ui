import type { JSX } from 'solid-js';

export interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /**
   * 视觉变体。
   * @default 'solid'
   */
  variant?: 'solid' | 'outline' | 'dashed' | 'text' | 'link';
  /**
   * 语义色；neutral 需显式传入。
   * @default 'primary'
   */
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * 是否占满父容器宽度。
   * @default false
   */
  block?: boolean;
  /**
   * 加载态；加载时禁用点击。
   * @default false
   */
  loading?: boolean;
  /**
   * 图标内容。
   * @default undefined
   */
  icon?: JSX.Element;
  /**
   * 图标位置。
   * @default 'start'
   */
  iconPosition?: 'start' | 'end';
  /**
   * 形状。
   * @default 'default'
   */
  shape?: 'default' | 'round' | 'circle';
  /**
   * 原生 button type，默认 button 以避免误触发表单提交。
   * @default 'button'
   */
  htmlType?: 'button' | 'submit' | 'reset';
}
