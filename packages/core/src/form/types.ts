/**
 * 表单控件基座（T2-02）的类型契约。
 *
 * 这一层只定义「Form.Item ↔ 控件」之间的最小协议：值 / 状态 / 禁用 / id 三件套 / a11y 属性，
 * 全部以 `Accessor` 形式给出 —— 控件不持有快照、不复制状态，Form 是唯一数据源
 * （`api-draft/Form.md §3` 的响应式契约，R3 裁决后口径不变）。
 *
 * 刻意不在这里出现的东西：校验规则、布局、DOM 结构。校验引擎与 `<Form.Item>` 的
 * label / 错误文案渲染属于 T2-08；本层只保证控件能拿到它需要读的一切。
 *
 * 值类型是 `unknown` 而不是泛型：字段值在运行期确实可能是 `string`（Input / Select）、
 * `boolean`（Checkbox / Switch）或 `number`（InputNumber），泛型只会把「运行期类型校验」
 * 推给每个调用点去做一次断言；用 `unknown` + 守卫更诚实，也符合 AGENTS.md §10「禁止 any」。
 */
import type { Accessor } from 'solid-js';

/** 字段校验状态。与 `api-draft/Form.md §4` 一致，只有两态。 */
export type FieldStatus = 'default' | 'error';

/**
 * 字段 id 三件套。
 *
 * 由字段宿主（`<Form.Item>`，或独立使用时的 `FieldProvider`）统一生成，
 * 控件**只读不造**：被表单包裹时控件自己传的 `id` 不生效，否则 `label[for]` 会指向空处。
 */
export interface FieldIds {
  /** 控件本体 id，也是 `label[for]` 的目标。 */
  control: string;
  /** label 元素 id，用作 `aria-labelledby`。 */
  label: string;
  /** 错误文案元素 id，用作 `aria-describedby`。 */
  message: string;
}

/**
 * 统一注入到控件根元素的无障碍属性。
 *
 * 一次性 spread 到控件上（`<input {...field.aria()} />`），避免每个控件各写四行。
 * `aria-invalid` 恒输出 `'true' | 'false'`，SSR 也输出 `'false'` —— 缺省 `undefined`
 * 会让服务端与客户端首帧的属性集不一致，产生 hydration 属性差（同口径见 `spikes/api-draft/`
 * 的 data 属性总表）。
 */
export interface FieldAria {
  /** 控件本体 id。 */
  id: string;
  /** 校验是否失败；恒输出字符串两态。 */
  'aria-invalid': 'true' | 'false';
  /** 错误文案元素 id；无错误时为 `undefined`（不输出该属性）。 */
  'aria-describedby': string | undefined;
  /** label 元素 id。 */
  'aria-labelledby': string;
}

/** 控件从字段上下文里能读到的一切。全部是 getter，读一次订阅一次。 */
export interface FieldControl {
  /** 字段名（与 `<Form.Item name>` 同值）。 */
  readonly name: string;
  /** 当前值；类型在控件侧用守卫收窄。 */
  readonly value: Accessor<unknown>;
  /** 写值；控件不落地本地状态，写回即由 Form 驱动重渲染。 */
  readonly setValue: (next: unknown) => void;
  /** 校验状态。 */
  readonly status: Accessor<FieldStatus>;
  /** 错误文案；无错误为 `undefined`。 */
  readonly message: Accessor<string | undefined>;
  /** 禁用态：`<Form disabled>` 与控件自身 `disabled` 的合并结果，由宿主决定语义。 */
  readonly disabled: Accessor<boolean>;
  /** id 三件套（静态，创建后不变）。 */
  readonly ids: FieldIds;
  /** 注入到控件的 a11y 属性（随 status / message 变化的 memo）。 */
  readonly aria: Accessor<FieldAria>;
}
