import type { JSX } from 'solid-js';

export interface TypographyProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'color' | 'ref'
> {
  /**
   * 语义色；不传时继承父级颜色。
   * @default undefined
   */
  tone?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'success' | 'warning' | 'danger';
  /**
   * 字号。
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * 是否加粗。
   * @default false
   */
  bold?: boolean;
  /**
   * 单行溢出省略。
   * @default false
   */
  ellipsis?: boolean;
  /**
   * 是否使用等宽代码样式。
   * @default false
   */
  code?: boolean;
  /**
   * 是否使用标记背景。
   * @default false
   */
  mark?: boolean;
  /**
   * 是否使用删除线。
   * @default false
   */
  delete?: boolean;
  /**
   * 是否使用下划线。
   * @default false
   */
  underline?: boolean;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 文本内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface TitleProps extends TypographyProps {
  /**
   * 标题层级，决定渲染的 h1~h5。
   * @default 1
   */
  level?: 1 | 2 | 3 | 4 | 5;
}

export interface LinkProps extends TypographyProps {
  /**
   * 链接地址。
   * @default undefined
   */
  href?: string;
  /**
   * 链接打开方式；target 为 _blank 时默认补充安全的 rel。
   * @default undefined
   */
  target?: string;
  /**
   * 链接关系。
   * @default undefined
   */
  rel?: string;
}
