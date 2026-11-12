/**
 * 复选框（T2-05）。
 *
 * DOM 是 `<label>` 包住原生 `type="checkbox"`，键盘（Space）、表单提交与
 * 读屏语义全部由浏览器原生承担，封装层**不接管键盘**（T2-01 已证伪
 * 「jsdom 下原生不响应、必须自己接管」的结论）。
 *
 * 半选是第三态：`data-scui-checked="mixed"` 与 `aria-checked="mixed"`
 * 同时输出，另外把原生 `indeterminate` **property** 交给客户端 effect 写入。
 * 它是 property 而不是 attribute，SSR 不序列化它，也就不会造成 hydration 属性差。
 */
import { createEffect, createMemo, createUniqueId, splitProps, useContext } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { resolveValue } from '../../utils/resolve-value';
import { CheckboxGroupContext } from '../selection/group-context';
import { syncChecked } from '../selection/selection-dom';
import { SelectionLabel, type SelectionShellAttributes } from '../selection/selection-label';
import type { SelectionChecked } from '../selection/selection-types';
import { useSelectionValue } from '../selection/use-selection-value';
import type { CheckboxProps } from './types';

export function Checkbox(props: CheckboxProps) {
  const [local, rest] = splitProps(props, [
    'checked',
    'defaultChecked',
    'indeterminate',
    'value',
    'onChange',
    'size',
    'status',
    'class',
    'disabled',
    'children',
  ]);

  const group = useContext(CheckboxGroupContext);
  const uid = createUniqueId();
  let control: HTMLInputElement | undefined;

  const bridge = useSelectionValue<boolean>({
    value: () => local.checked,
    defaultValue: () => local.defaultChecked,
    onChange: () => local.onChange,
    fromField: (raw) => raw === true,
    fallback: () => false,
  });

  const inGroup = () => group !== undefined && local.value !== undefined;
  // 派生值一律用 createMemo：它在本组件的 root 内**同步**首次求值，
  // 让 props 的响应式 getter 在建 memo 时就有 Owner。若写成普通函数并只在
  // change 回调里首次读，getter 会在事件回调（Owner=null）里创建 memo，
  // 触发 Solid 的 "computations created outside a createRoot" 警告。
  const checked = createMemo(() =>
    inGroup() ? (group?.values().includes(local.value ?? '') ?? false) : bridge.value(),
  );
  const indeterminate = createMemo(() =>
    local.indeterminate === undefined ? false : resolveValue(local.indeterminate),
  );
  const disabled = () =>
    Boolean(local.disabled) || (group?.disabled() ?? false) || (bridge.field?.disabled() ?? false);
  const size = () => local.size ?? group?.size() ?? 'medium';
  const status = () => local.status ?? bridge.field?.status() ?? 'default';
  const invalid = () => status() === 'error';
  const checkedState = (): SelectionChecked =>
    indeterminate() ? 'mixed' : checked() ? 'true' : 'false';
  const controlId = () => bridge.field?.aria().id ?? rest.id ?? `scui-checkbox-${uid}`;

  // 原生 checkbox 的 indeterminate 只能通过 DOM property 设置；SSR 无 DOM，
  // createEffect 不执行，客户端挂载后随 props 变化持续同步。
  // 原生 checkbox 的 indeterminate 只能通过 DOM property 设置；SSR 无 DOM，
  // createEffect 不执行，客户端挂载后随 props 变化持续同步。
  createEffect(() => {
    const mixed = indeterminate();
    if (control) control.indeterminate = mixed;
  });

  const commit = (next: boolean, event?: Event & { currentTarget: HTMLInputElement }) => {
    if (inGroup()) {
      const option = local.value ?? '';
      const current = group?.values() ?? [];
      const nextValues = next
        ? current.includes(option)
          ? [...current]
          : [...current, option]
        : current.filter((item) => item !== option);
      group?.write(nextValues, event);
      local.onChange?.(next, event);
    } else {
      bridge.setValue(next, event);
    }
  };

  const shell = (): SelectionShellAttributes => ({
    class: classNames(`${CSS_PREFIX}checkbox`, local.class),
    'data-scui-role': 'checkbox',
    'data-scui-checked': checkedState(),
    'data-scui-size': size(),
    'data-scui-disabled': disabled() ? '' : undefined,
    'data-scui-invalid': invalid() ? 'true' : 'false',
  });

  return (
    <SelectionLabel
      shell={shell()}
      block={`${CSS_PREFIX}checkbox`}
      controlId={controlId()}
      onRef={(element) => {
        control = element;
      }}
      indicator={
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
          <path
            d={indeterminate() ? 'M4 8h8' : 'M3.5 8.5l3 3 6-6.5'}
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      }
      input={{
        ...rest,
        type: 'checkbox',
        name: inGroup() ? group?.name() : rest.name,
        value: local.value,
        checked: checked(),
        disabled: disabled(),
        'aria-checked': checkedState(),
        'aria-invalid': invalid() ? 'true' : 'false',
        ...(bridge.field ? bridge.field.aria() : {}),
        onChange: (event) => {
          const target = event.currentTarget;
          commit(target.checked, event);
          // 浏览器已切过 DOM；受控 / 字段 / Group 未回写时这里负责回弹到计算值，
          // 同时把被浏览器清掉的 indeterminate property 恢复。
          syncChecked(target, checked(), indeterminate());
        },
      }}
    >
      {local.children}
    </SelectionLabel>
  );
}
