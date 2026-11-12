/**
 * 开关（T2-05）。
 *
 * 与 `Checkbox` 共用值桥与 label 壳，只换两处：原生控件带 `role="switch"`，
 * 指示器换成「轨道 + 滑块」。`role="switch"` 必须有 `aria-checked`，
 * 本组件恒输出 `'true' | 'false'` 两态，SSR 与首帧属性集因此一致。
 *
 * 不自己接管键盘：原生 checkbox 的 Space / 表单提交 / 焦点行为已经完备，
 * 包装一层只会引入与浏览器不同步的状态（T2-01 的 S-02 证伪结论）。
 */
import { createMemo, createUniqueId, splitProps } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { syncChecked } from '../selection/selection-dom';
import { SelectionLabel, type SelectionShellAttributes } from '../selection/selection-label';
import type { SelectionChecked } from '../selection/selection-types';
import { useSelectionValue } from '../selection/use-selection-value';
import type { SwitchProps } from './types';

export function Switch(props: SwitchProps) {
  const [local, rest] = splitProps(props, [
    'checked',
    'defaultChecked',
    'onChange',
    'size',
    'status',
    'class',
    'disabled',
    'children',
  ]);

  const uid = createUniqueId();
  const bridge = useSelectionValue<boolean>({
    value: () => local.checked,
    defaultValue: () => local.defaultChecked,
    onChange: () => local.onChange,
    fromField: (raw) => raw === true,
    fallback: () => false,
  });

  // 同 Checkbox：派生值在 root 内同步首次求值，避免 change 回调里
  // 才触发 props getter 的 memo 创建（Owner=null 会告警）。
  const checked = createMemo(() => bridge.value());
  const disabled = () => Boolean(local.disabled) || (bridge.field?.disabled() ?? false);
  const size = () => local.size ?? 'medium';
  const status = () => local.status ?? bridge.field?.status() ?? 'default';
  const invalid = () => status() === 'error';
  const checkedState = (): SelectionChecked => (checked() ? 'true' : 'false');
  const controlId = () => bridge.field?.aria().id ?? rest.id ?? `scui-switch-${uid}`;

  const shell = (): SelectionShellAttributes => ({
    class: classNames(`${CSS_PREFIX}switch`, local.class),
    'data-scui-role': 'switch',
    'data-scui-checked': checkedState(),
    'data-scui-size': size(),
    'data-scui-disabled': disabled() ? '' : undefined,
    'data-scui-invalid': invalid() ? 'true' : 'false',
  });

  return (
    <SelectionLabel
      shell={shell()}
      block={`${CSS_PREFIX}switch`}
      controlId={controlId()}
      indicator={
        <span class={`${CSS_PREFIX}switch__track`}>
          <span class={`${CSS_PREFIX}switch__thumb`} />
        </span>
      }
      input={{
        ...rest,
        type: 'checkbox',
        role: 'switch',
        checked: checked(),
        disabled: disabled(),
        'aria-checked': checkedState(),
        'aria-invalid': invalid() ? 'true' : 'false',
        ...(bridge.field ? bridge.field.aria() : {}),
        onChange: (event) => {
          const target = event.currentTarget;
          bridge.setValue(target.checked, event);
          syncChecked(target, checked());
        },
      }}
    >
      {local.children}
    </SelectionLabel>
  );
}
