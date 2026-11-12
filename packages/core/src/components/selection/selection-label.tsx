/**
 * 三件套共用的 `<label>` 壳（T2-05）。
 *
 * 「共享 label 逻辑」指的是这条链路只写一次：原生 input 被 `<label>` 包裹、
 * `for` 与 `id` 同源、`aria-labelledby` 恒有真实目标、文案 span 统一类名。
 * 各组件只给**视觉指示器**（勾 / 圆点 / 开关轨道）与自己的 `data-scui-*` 契约，
 * 不各自复制一遍 label 结构 —— 这类复制最容易漏掉 `for`，最后变成「点文字不切换」。
 *
 * `aria-labelledby` 的接管规则：
 *  - 有文案时，文案 span 继承字段宿主给的 label id（没有宿主时用自建 uid），
 *    于是 `FieldProvider` 注入的 `aria-labelledby` **永远指向真实存在的节点**；
 *    T2-08 的 `<Form.Item>` 只需复用同一组 id，不必改本层。
 *  - 无文案时不输出该属性，可访问名称交给使用方的 `aria-label` 或外层 Form label。
 */
import { createUniqueId, Show, type JSX } from 'solid-js';

import type { SelectionChecked, SelectionSize } from './selection-types';

/** 壳属性：由各组件构造，让每个组件的 `data-scui-*` 契约留在自己的源码里。 */
export interface SelectionShellAttributes {
  /** 块类名（静态类，不带 modifier）。 */
  class?: string;
  /** 结构定位锚点。 */
  'data-scui-role'?: string;
  /** 选中三态，恒输出。 */
  'data-scui-checked'?: SelectionChecked;
  /** 尺寸档位。 */
  'data-scui-size'?: SelectionSize;
  /** 禁用态（存在即真）。 */
  'data-scui-disabled'?: '' | undefined;
  /** 校验态两态，恒输出。 */
  'data-scui-invalid'?: 'true' | 'false';
}

/** `SelectionLabel` 的入参。 */
export interface SelectionLabelProps {
  /** 根 label 的属性（含 data-scui-* 契约）。 */
  shell: SelectionShellAttributes;
  /** 原生 input 的属性；组件负责 `id` / `aria-labelledby` / `ref` 三项覆盖。 */
  input: JSX.InputHTMLAttributes<HTMLInputElement>;
  /** 视觉指示器（勾 / 圆点 / 轨道），对读屏隐藏。 */
  indicator: JSX.Element;
  /** 块类名前缀，如 `scui-checkbox`。 */
  block: string;
  /** 控件本体 id，同时用作 `label[for]`。 */
  controlId: string;
  /** 拿到 input 引用（Checkbox 用它设置 `indeterminate` DOM property）。 */
  onRef?: (element: HTMLInputElement) => void;
  /** 文案；缺省时控件需要外部给 `aria-label`。 */
  children?: JSX.Element;
}

/** 渲染「label 壳 + 原生控件 + 指示器 + 文案」四段固定结构。 */
export function SelectionLabel(props: SelectionLabelProps): JSX.Element {
  const uid = createUniqueId();
  const hasText = () => Boolean(props.children);
  const labelId = () => props.input['aria-labelledby'] ?? `scui-selection-${uid}-label`;

  return (
    <label {...props.shell} for={props.controlId}>
      <input
        {...props.input}
        id={props.controlId}
        class={`${props.block}__control`}
        aria-labelledby={hasText() ? labelId() : props.input['aria-labelledby']}
        ref={(element) => props.onRef?.(element)}
      />
      <span class={`${props.block}__indicator`} aria-hidden="true">
        {props.indicator}
      </span>
      <Show when={hasText()}>
        <span class={`${props.block}__label`} id={labelId()}>
          {props.children}
        </span>
      </Show>
    </label>
  );
}
