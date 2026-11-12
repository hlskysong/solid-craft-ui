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
