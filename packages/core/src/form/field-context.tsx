/**
 * 字段上下文（T2-02）。
 *
 * `FieldProvider` 是 `<Form.Item>` 的内核：它把「一个字段的值 / 状态 / id / a11y」写进
 * Context，控件用 `useFormField()` 读出来。**它自己不产出任何 DOM** —— label、错误文案、
 * 布局、必填星号都是 T2-08 的 `<Form.Item>` 的事；这样 T2-02 的基座可以先被控件消费，
 * Form 组件晚一步落地也不会返工。
 *
 * 为什么 id 由宿主生成而不是控件生成：`label[for]` / `aria-describedby` 是三方共享的，
 * 只有宿主同时认识 label、错误文案与控件，能保证三者指向同一组 id。控件若自造 id，
 * 被 `<Form.Item>` 包裹时 label 就会指向空处。
 */
import { createContext, createMemo, createUniqueId, type JSX } from 'solid-js';

import type { FieldAria, FieldControl, FieldIds, FieldStatus } from './types';

/** 字段上下文。默认值是 `undefined`，以便「脱离表单独立使用」与「用错位置」可区分。 */
export const FieldContext = createContext<FieldControl>();

/** `FieldProvider` 的入参。除 `ids` / `name` 外全部是 getter，**不接收快照值**。 */
export interface FieldProviderProps {
  /** 字段名，会透出成 `FieldControl.name`。 */
  name: string;
  /** 当前值 getter。 */
  value: () => unknown;
  /** 写值回调，`unknown` 的收窄由调用方（控件）负责。 */
  setValue: (next: unknown) => void;
  /**
   * 校验状态 getter。
   * @default 由 message 推导：有文案即 `'error'`，否则 `'default'`
   */
  status?: () => FieldStatus;
  /**
   * 错误文案 getter。
   * @default undefined
   */
  message?: () => string | undefined;
  /**
   * 禁用态 getter。
   * @default () => false
   */
  disabled?: () => boolean;
  /**
   * 外部指定的 id 三件套（`<Form.Item>` 需要先渲染 label 再挂控件时用）。
   * 缺省的项由 `createUniqueId()` 补齐；三件套是静态的，创建后不随渲染变化。
   * @default 全部自动生成
   */
  ids?: Partial<FieldIds>;
  /** 字段内容（通常是控件）。 */
  children?: JSX.Element;
}

/**
 * 把字段状态写进 Context，供控件读取。
 *
 * 不产出 DOM：返回的就是 `Context.Provider` 本身。
 */
export function FieldProvider(props: FieldProviderProps): JSX.Element {
  // 同一个字段的三个 id 必须同源，因此只取一次 uid；前缀用 `scui-field-` 与
  // S-06 预研的 id 口径保持一致，避免两套命名。
  const uid = createUniqueId();
  const ids: FieldIds = {
    control: props.ids?.control ?? `scui-field-${uid}`,
    label: props.ids?.label ?? `scui-field-${uid}-label`,
    message: props.ids?.message ?? `scui-field-${uid}-message`,
  };

  const message = () => props.message?.();
  // status 允许显式给（warning 之类将来扩展时由宿主决定），缺省按「有无错误文案」推导，
  // 避免宿主同时维护 message 与 status 两份真源。
  const status = (): FieldStatus =>
    props.status?.() ?? (message() === undefined ? 'default' : 'error');
  const disabled = () => props.disabled?.() ?? false;

  const aria = createMemo<FieldAria>(() => ({
    id: ids.control,
    'aria-invalid': status() === 'error' ? 'true' : 'false',
    'aria-describedby': message() === undefined ? undefined : ids.message,
    'aria-labelledby': ids.label,
  }));

  const field: FieldControl = {
    name: props.name,
    value: () => props.value(),
    setValue: (next) => props.setValue(next),
    status,
    message,
    disabled,
    ids,
    aria,
  };

  return <FieldContext.Provider value={field}>{props.children}</FieldContext.Provider>;
}
