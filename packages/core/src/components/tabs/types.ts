/**
 * `Tabs` 的公共类型（T3-11，§4.2 与 `docs/04 §2.3`「线型/卡片、可编辑、懒加载」）。
 *
 * 冻结面只给四条验收（线型 / 卡片 / 懒加载 / 键盘导航），`docs/01~07` 与
 * `spikes/api-draft/` 对 Tabs **零 API 草案、零 data 属性登记**。因此范围严格按
 * §4.2 收口，不做「可编辑」（`docs/04 §2.3` 的说明列提到但任务验收列没要求）。
 *
 * 键盘 / 焦点 / ARIA 全部由 Kobalte Tabs 原语承担：`docs/02 L563`「Kobalte 负责
 * Dialog / Select / Menu / Tabs / Tooltip 等原语的焦点与键盘；我们负责样式、
 * 语义补充、业务状态」、`L568`「Tabs：aria-controls、aria-selected、方向键」。
 * 组件层不写 `role="tablist"` / `onKeyDown` / `tabIndex`，也不另建第二套焦点状态。
 *
 * 属性口径：
 * - 样式变体**复用** `data-scui-variant`：AGENTS 硬约束 3 把「变体」明文指派给它，
 *   Skeleton 的形状变体与 Tabs 的 line / card 都是「组件视觉变体」这一个语义，
 *   取值按组件枚举扩展，不是同名不同义。刻意不新增 `-type`（硬约束 3 指派给文本
 *   语义）、`-style`（太泛）、`-mode`（语义重复）。
 * - 激活态**复用** `data-scui-current`：与 Pagination「当前页」同为「当前位于」，
 *   和 Kobalte 输出 `aria-selected="true"` 构成双通道。不复用 `data-scui-active`
 *   （Skeleton 微光动画开）、`data-scui-selected`（列表项被选中）——语义不同。
 * - 禁用复用 `data-scui-disabled`（存在即真），与原生 `disabled` 双保险。
 *
 * R3：函数型 prop（`onChange` / `TabItem.content`）直接声明为函数，不用
 * `MaybeAccessor` 包裹。`content` 是**惰性渲染工厂**而非状态回调：只有 panel
 * 真正挂载时才会调用，这是「懒加载」能被单测计数的关键。
 */
import type { JSX } from 'solid-js';

/** 标签页样式变体，默认 `line`。 */
export type TabsVariant = 'line' | 'card';

/** 单个标签页的定义。 */
export interface TabItem {
  /** 唯一 key，同时是 Kobalte 的 value / Trigger 与 Content 的关联键。 */
  key: string;
  /** 标签头文案。 */
  label: JSX.Element;
  /**
   * 面板内容的**惰性工厂**。只有该 panel 首次挂载时才调用；`lazy` 为 true 时
   * 未激活的 panel 不挂载，因此连节点创建都被推迟，而不只是「插进 DOM 后隐藏」。
   */
  content?: () => JSX.Element;
  /** 禁用该标签；原生 `disabled` 与 `data-scui-disabled` 同时输出。 */
  disabled?: boolean;
}

/** `<Tabs>` 入参。原生属性照常透传到根节点。 */
export interface TabsProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  /** 标签页列表。 */
  items: TabItem[];
  /** 受控激活 key；给出时点击只发 `onChange`，DOM 由调用方回弹。 */
  value?: string;
  /** 非受控初始 key；缺省时回落到 `items[0].key`。 */
  defaultValue?: string;
  /** 激活 key 变化；受控与非受控都只走这一个出口。 */
  onChange?: (value: string) => void;
  /**
   * 样式变体，恒输出为 `data-scui-variant`。
   * @default 'line'
   */
  variant?: TabsVariant;
  /**
   * 懒加载：`true` 时只挂载激活 panel（Kobalte 默认 presence），切换会卸载旧
   * panel；`false` 时所有 panel 首帧即挂载，非激活panel 用原生 `hidden` 收起。
   * @default true
   */
  lazy?: boolean;
  /** `tablist` 的无障碍名称；恒输出，避免 axe 的 landmark/控件无名。 @default '标签页' */
  'aria-label'?: string;
}
