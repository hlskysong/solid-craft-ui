/**
 * 原语层（primitives）公共类型。
 *
 * 这一层是 Kobalte 等第三方无头库与组件库之间的**唯一接缝**：
 * 上层组件只认这里声明的类型与 DOM 契约（`data-scui-primitive` / `data-scui-state`），
 * 第三方库的 props / 泛型 / 回调形态一律不越过本文件。
 *
 * 约束（`pnpm check:exports` 第 6 条兜底）：
 * 本目录产出的 `.d.ts` 不得出现 `@kobalte/` 等第三方包名 —— 换实现库时
 * 上层组件与消费方都不需要改类型。
 */
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../utils/resolve-value';

/**
 * 选项数据结构。
 *
 * `value` 是提交与受控状态的唯一标识（R2 = A：对外字符串）；
 * 原语内部会把它映射成 Kobalte 需要的 option 对象，该映射不外泄。
 */
export interface PrimitiveOption {
  /** 选项值，受控 / 非受控状态的唯一标识。 */
  value: string;
  /** 展示文案。 */
  label: string;
  /** 是否禁用。 @default false */
  disabled?: boolean;
}

/**
 * 对话框原语。
 *
 * 只负责行为与 A11y 契约（焦点陷阱 / `aria-haspopup` / `aria-describedby`），
 * 不带任何样式：视觉由上层组件通过 `data-scui-primitive` 选择器接管。
 */
export interface PrimitiveDialogProps {
  /** 触发按钮文案；值 / getter 均可。 */
  trigger: MaybeAccessor<string>;
  /** 对话框标题；值 / getter 均可。A11y 上作为 `aria-labelledby` 的来源。 */
  title: MaybeAccessor<string>;
  /** 内容区，同时作为 `aria-describedby` 的描述正文。 @default undefined */
  children?: JSX.Element;
  /** 初始是否打开。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化回调（受控与非受控共用）。 */
  onOpenChange?: (open: boolean) => void;
  /** 关闭按钮文案。 @default '关闭' */
  closeLabel?: string;
  /** 触发按钮的自定义类名。 @default undefined */
  class?: string;
}

/**
 * 上层传给浮层原语的 DOM 属性包。
 *
 * 只承载类名与 `data-*` 状态，**不承载事件与第三方类型**：原语自己挂 ESC /
 * 外部点击 / 焦点钩子，上层若能把事件透传进来就会把两套 dismiss 逻辑叠在一起。
 */
export type PrimitiveOverlayAttributes = {
  class?: string;
  style?: string;
} & Record<`data-${string}`, string | undefined>;

/**
 * 浮层原语（T3-07）：`Modal`（T3-07）与 `Drawer`（T3-08）共用的受控浮层接缝。
 *
 * 与 `PrimitiveDialog` 的区别：那份原语强制自带 `Dialog.Trigger`、只有
 * `defaultOpen`；这里不渲染触发按钮，完全由 `open` 受控，供业务侧外部按钮驱动。
 */
export interface PrimitiveOverlayProps {
  /** 受控打开状态；上层永远传值，原语不做状态裁决，也不管理内部信号。 */
  open: boolean;
  /** 打开状态变更请求；上层可据此拦截关闭（如异步提交未结束）。 */
  onOpenChange?: (open: boolean) => void;
  /** 标题，渲染进 `KobalteDialog.Title`，是 `aria-labelledby` 的来源。 */
  title: JSX.Element;
  /**
   * 正文。刻意不用 `KobalteDialog.Description` 包裹：它渲染成 `<p>`，
   * 而 Modal 正文常是表单 / 表格，塞进段落会产生非法嵌套。
   */
  children?: JSX.Element;
  /** 底部操作区；`null` / `undefined` 时整块不渲染，不留空盒子。 */
  footer?: JSX.Element | null;
  /** 关闭按钮的无障碍文案，可见部分恒为装饰性「×」。 @default '关闭' */
  closeLabel?: string;
  /** 是否渲染右上角关闭按钮。 @default true */
  closable?: boolean;
  /** 是否允许 ESC 关闭。 @default true */
  keyboard?: boolean;
  /** 是否允许点击遮罩 / 弹层外部关闭。 @default true */
  maskClosable?: boolean;
  /**
   * 是否允许「非业务路径」关闭（ESC / 遮罩 / 外部交互 / 关闭按钮）。
   * 异步提交期间由上层置 `false`，避免请求未回来就关掉弹层。
   * 与 `keyboard` / `maskClosable` 正交：后者是静态配置，这里是运行时拦截。
   * @default true
   */
  dismissible?: boolean;
  /** 遮罩、内容、标题、正文、底部、关闭按钮各自的属性包（视觉归上层）。 */
  overlayAttributes?: PrimitiveOverlayAttributes;
  contentAttributes?: PrimitiveOverlayAttributes;
  titleAttributes?: PrimitiveOverlayAttributes;
  bodyAttributes?: PrimitiveOverlayAttributes;
  footerAttributes?: PrimitiveOverlayAttributes;
  closeAttributes?: PrimitiveOverlayAttributes;
  /** 焦点刚要移入弹层时触发；原语在此记录触发元素。 */
  onOpenAutoFocus?: (event: Event) => void;
  /** 焦点即将归还时触发；原语已先接管默认行为。 */
  onCloseAutoFocus?: (event: Event) => void;
}

/**
 * 选择器原语。
 *
 * R2 = A 的落点：对外 `value` 是字符串，Kobalte 的「整个 option 对象作受控值」
 * 在内部完成双向映射。键盘 / typeahead / 焦点陷阱沿用原语实现。
 */
export interface PrimitiveSelectProps {
  /** 选项列表；值 / getter 均可，getter 能保留细粒度追踪。 */
  options: MaybeAccessor<readonly PrimitiveOption[]>;
  /** 当前值；值 / getter 均可。 @default undefined */
  value?: MaybeAccessor<string | undefined>;
  /** 值变化回调。 */
  onChange?: (value: string) => void;
  /** 占位文案；值 / getter 均可。 @default '请选择' */
  placeholder?: MaybeAccessor<string | undefined>;
  /** 禁用态；值 / getter 均可。 @default false */
  disabled?: MaybeAccessor<boolean>;
  /** 根节点自定义类名。 @default undefined */
  class?: string;
  /** 无障碍标签，缺省时回落到占位文案。 @default undefined */
  'aria-label'?: string;
  /** 原生表单字段名，写进隐藏字段；不传则不输出 name 属性。 @default undefined */
  name?: string;
  /**
   * 触发器之后的兄弟级插槽（上层放清除按钮）。
   * 原语只提供 DOM 接缝，不产出业务文案与样式。
   * @default undefined
   */
  triggerSuffix?: JSX.Element;
  /**
   * 弹层内、列表之前的插槽（上层放本地搜索输入框）。
   * 只在客户端 `useClientReady()` 为真时装载，SSR 不输出。
   * @default undefined
   */
  contentHeader?: JSX.Element;
  /** 弹层内、列表之后的插槽（上层放空态 / 加载提示）。 @default undefined */
  contentFooter?: JSX.Element;
  /**
   * 透传到触发按钮的原生 / A11y 属性（如 `<Form.Item>` 的 aria 三件套）。
   * 由上层组装后一次 spread，原语层不引用表单类型。
   * @default undefined
   */
  triggerAttributes?: JSX.HTMLAttributes<HTMLButtonElement>;
  /**
   * 本地搜索词；只影响 `itemComponent` 的条目渲染，**不改传给 Kobalte 的 options 数组**。
   * Kobalte 0.13 在 collection 被替换时会重建状态并主动关闭弹层，因此过滤不能靠换数组实现。
   * @default ''
   */
  query?: string;
  /**
   * 隐藏全部条目（加载态 / 无匹配结果时由上层置真），collection 仍保持不变。
   * @default false
   */
  hideOptions?: boolean;
  /** 展开状态变化回调，供上层同步 `data-scui-open`。 @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** 触发按钮类名钩子（视觉归上层组件）。 @default undefined */
  triggerClass?: string;
  /** 弹层容器类名钩子。 @default undefined */
  contentClass?: string;
  /** 选项类名钩子。 @default undefined */
  optionClass?: string;
}

/**
 * 锚定浮层相对触发元素的方向（T3-09）。
 *
 * 刻意不复用 `data-scui-placement`：那是 App / Message 的「反馈容器出现在屏幕
 * 哪个角」（六向），也不复用 `data-scui-side`：那是 Drawer「贴视口哪条边」
 * （四向）。这里是「浮层挂在触发元素哪一侧」，与 Floating UI 的 Placement 同形，
 * 一个属性名只表达一个语义（R1）。
 */
export type PrimitiveAnchorPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end';

/** 上层传给锚定浮层原语的 DOM 属性包；同样**不承载事件**，避免叠两套 dismiss。 */
export type PrimitiveAnchoredAttributes = {
  class?: string;
  style?: string;
} & Record<`data-${string}`, string | undefined>;

/** `PrimitiveTooltip` / `PrimitivePopover` 共有的锚定契约。 */
export interface PrimitiveAnchoredProps {
  /** 受控打开状态；给了就完全由调用方驱动。 @default undefined */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；hover / 点击 / ESC / 外部交互都汇到这一条。 */
  onOpenChange?: (open: boolean) => void;
  /** 触发元素内容；原语负责把它包进 Kobalte 的 Trigger（按钮语义由原语保证）。 */
  trigger: JSX.Element;
  /** 浮层正文。 */
  children?: JSX.Element;
  /** 锚定方向。 @default 'top' */
  placement?: PrimitiveAnchorPlacement;
  /** 浮层与触发元素的间距（px）。 @default 8 */
  gutter?: number;
  /** 是否渲染箭头。 @default true */
  arrow?: boolean;
  /** 是否禁用触发。 @default false */
  disabled?: boolean;
  /** 触发按钮属性包（视觉归上层）。 */
  triggerAttributes?: PrimitiveAnchoredAttributes;
  /** 内容容器属性包，含 `data-scui-anchor`（视觉归上层）。 */
  contentAttributes?: PrimitiveAnchoredAttributes;
  /** 箭头属性包（视觉归上层）。 */
  arrowAttributes?: PrimitiveAnchoredAttributes;
}

/**
 * Tooltip 原语（T3-09）：只在共有契约上加「延迟」。
 *
 * hover / focus 时序、ESC 关闭、安全区、翻转定位全部由 Kobalte 的 Tooltip
 * 与 DismissableLayer 实现；本层不写任何 `document.activeElement`、
 * `onCloseAutoFocus` 或 ESC 钩子 —— 焦点归还与 ESC 只有一套语义。
 */
export interface PrimitiveTooltipProps extends PrimitiveAnchoredProps {
  /** 指针进入触发元素到打开的时间（ms）。 @default 200 */
  openDelay?: number;
  /** 指针离开到关闭的时间（ms）。 @default 100 */
  closeDelay?: number;
}

/**
 * Popconfirm 原语（T3-09）：只在共有契约上加「运行时关闭闸门」与语义标题。
 *
 * 与 `PrimitiveOverlayProps.dismissible` 同口径：这是**拦截**已有 dismiss 出口，
 * 不是另起一套关闭逻辑。`false` 时把所有 ESC / outside / focus-outside 请求
 * `preventDefault()`，Kobalte 仍是唯一的 dismiss 实现者。
 */
export interface PrimitivePopoverProps extends PrimitiveAnchoredProps {
  /** 是否允许非业务路径关闭；异步确认期间由上层置 `false`。 @default true */
  dismissible?: boolean;
  /** 标题，渲染进 `Popover.Title`，是 `aria-labelledby` 的来源。 */
  title: JSX.Element;
  /** 描述，渲染进 `Popover.Description`，是 `aria-describedby` 的来源。 */
  description?: JSX.Element;
  /** 标题属性包（视觉归上层）。 */
  titleAttributes?: PrimitiveAnchoredAttributes;
  /** 描述属性包（视觉归上层）。 */
  descriptionAttributes?: PrimitiveAnchoredAttributes;
}
