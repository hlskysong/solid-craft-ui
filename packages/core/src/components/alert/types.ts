/**
 * `Alert` 的公共类型（T3-09，§4.2 与 `docs/04 §2.4`「类型、可关闭、描述、操作」）。
 *
 * `data-scui-kind` **复用** T2-06 已登记的属性：它表达「一条反馈自身的语义类型」，
 * 与 App / Message / Notification 完全同义，只是取值少一个 `loading`
 * （Alert 是静态页面内提示，没有「进行中」态）。R1 的「一个属性名只表达一个
 * 语义」在这里是复用而非另起新名，别名反而会造成两套选择器。
 *
 * R3：函数型 prop（`onClose`）直接声明为函数，不用 `MaybeAccessor` 包裹。
 */
import type { JSX } from 'solid-js';

/** 反馈语义类型，默认 `info`。 */
export type AlertKind = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  /** 反馈语义类型，恒输出为 `data-scui-kind`。 @default 'info' */
  kind?: AlertKind;
  /** 标题；省略时只显示描述。 */
  title?: JSX.Element;
  /** 描述正文。 */
  description?: JSX.Element;
  /** 是否显示右上角关闭按钮。 @default true */
  closable?: boolean;
  /** 关闭按钮的无障碍文案。 @default '关闭' */
  closeLabel?: string;
  /** 点击关闭后触发；组件内部同时移除自身 DOM。 */
  onClose?: () => void;
  /** 右侧操作区；不传时整块不渲染，不留空盒子。 */
  action?: JSX.Element;
  /** 补充正文（与 description 并列，供需要富内容的场景使用）。 */
  children?: JSX.Element;
  /** 自定义图标；传 `null` 表示整块不渲染。 @default undefined */
  icon?: JSX.Element | null;
  /** 根节点自定义类名。 @default undefined */
  class?: string;
}
