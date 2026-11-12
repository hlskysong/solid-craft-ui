/**
 * `Select` 的公共类型（T2-07）。
 *
 * R2 = A（Aming 2026-11-11 裁决）：对外 `value` / `onChange` 只暴露业务字符串，
 * Kobalte 要求的「整个 option 对象作受控值」由 `src/primitives/select.tsx` 吸收，
 * 公共 `.d.ts` 零第三方类型泄漏。
 *
 * 本轮范围按 `docs/08 §4.1` 的 T2-07 验收列：单选 + 本地搜索 + 清除 + 空态 +
 * loading + 受控/非受控 + SSR 静态骨架。多选 / 远程搜索 / 分组 / 虚拟滚动 /
 * `fieldNames` / `labelInValue` 属 `api-draft/Select.md §1` 明确不做或 P1，留待后续。
 */
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';
import type { SelectionSize, SelectionStatus } from '../selection/selection-types';

/** 尺寸口径与全局一致：只有 `small` / `medium` / `large`，不存在 `md` / `sm`。 */
export type SelectSize = SelectionSize;

/** 校验态。与 `FieldStatus` 同值域，避免控件与表单出现两套状态词。 */
export type SelectStatus = SelectionStatus;

/**
 * 扁平选项。`label` 必须是字符串：原语用它做 typeahead（`optionTextValue`），
 * 本地搜索也按它过滤；渲染富文本选项属 P1。
 */
export interface SelectOption {
  /** 选项值；受控状态、字段值与 `onChange` 的唯一标识。 */
  value: string;
  /** 选项展示文案，同时是搜索与 typeahead 的匹配文本。 */
  label: string;
  /** 单个选项禁用。 @default false */
  disabled?: boolean;
}

/** 值变更回调；空字符串表示已清空。 */
export type SelectChangeHandler = (value: string) => void;

/**
 * `Select` 的入参。原生 `div` 属性照常透传，仅覆盖与控件语义冲突的项。
 *
 * 值优先级：`<Form.Item>` 字段 > `value` > `defaultValue` / 内部状态；
 * 受控且外部未回写时控件保持原值（标准「回弹」），不偷偷接管。
 */
export interface SelectProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'value' | 'defaultValue' | 'onChange' | 'children'
> {
  /** 选项列表；值 / getter 均可，getter 能保留细粒度追踪。 */
  options: MaybeAccessor<readonly SelectOption[]>;
  /** 受控值；支持传值或 getter，空字符串表示「已清空」。 @default undefined（非受控） */
  value?: MaybeAccessor<string>;
  /** 非受控初始值；仅在挂载时读取一次。 @default '' */
  defaultValue?: MaybeAccessor<string>;
  /** 选中或清空时触发；清空时值为空字符串。 @default undefined */
  onChange?: SelectChangeHandler;
  /** 未选中时的占位文案，同时是无障碍名称的回落值。 @default '请选择' */
  placeholder?: string;
  /** 禁用态；值 / getter 均可。 @default false */
  disabled?: MaybeAccessor<boolean>;
  /** 加载态：弹层显示加载提示且不渲染选项；触发器置 `aria-busy`。 @default false */
  loading?: MaybeAccessor<boolean>;
  /** 开启本地搜索：弹层顶部出现输入框，按 `label` 大小写不敏感过滤。 @default false */
  searchable?: boolean;
  /** 允许清空：有选中值且未禁用时，在触发器旁渲染清除按钮。 @default false */
  clearable?: boolean;
  /** 尺寸。 @default 'medium' */
  size?: SelectSize;
  /** 校验态；`error` 时输出 `data-scui-invalid="true"`。 @default 'default' */
  status?: SelectStatus;
  /** 无障碍标签，缺省时回落到占位文案。 @default undefined */
  'aria-label'?: string;
  /** 原生表单字段名，由原语写进隐藏字段；缺省时不参与表单提交。 @default undefined */
  name?: string;
  /** 搜索框占位与无障碍名称。 @default '搜索' */
  searchPlaceholder?: string;
  /** 无匹配选项时的提示文案。 @default '无匹配结果' */
  emptyText?: string;
  /** 加载态提示文案。 @default '加载中' */
  loadingText?: string;
  /** 清除按钮的无障碍名称。 @default '清除' */
  clearLabel?: string;
}
