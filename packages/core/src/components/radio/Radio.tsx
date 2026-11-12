/**
 * 单选框（T2-05）。
 *
 * 复用 `SelectionLabel` 的 label 链路；视觉指示器换成圆点，交互仍由原生
 * `type="radio"` 提供（方向键切换、互斥、Tab 只进已选中项都是浏览器行为）。
 * 独立使用时自动给一个唯一 `name`，否则同页两组独立 radio 会互相排斥 ——
 * 这类 bug 只在页面上有第二个组时才出现，靠 demo 人肉检查抓不住。
 */
import { createMemo, createUniqueId, splitProps, useContext } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { RadioGroupContext } from '../selection/group-context';
import { syncChecked, syncRadioGroup } from '../selection/selection-dom';
import { SelectionLabel, type SelectionShellAttributes } from '../selection/selection-label';
import type { SelectionChecked } from '../selection/selection-types';
import { useSelectionValue } from '../selection/use-selection-value';
import type { RadioProps } from './types';

export function Radio(props: RadioProps) {
  const [local, rest] = splitProps(props, [
    'checked',
    'defaultChecked',
    'value',
    'onChange',
    'size',
    'status',
    'class',
    'disabled',
    'children',
  ]);

  const group = useContext(RadioGroupContext);
  const uid = createUniqueId();

  const bridge = useSelectionValue<boolean>({
    value: () => local.checked,
    defaultValue: () => local.defaultChecked,
    onChange: () => local.onChange,
    fromField: (raw) => raw === true,
    fallback: () => false,
  });

  const inGroup = () => group !== undefined && local.value !== undefined;
  // 同 Checkbox：派生值在 root 内同步首次求值，避免 change 回调里
  // 才触发 props getter 的 memo 创建（Owner=null 会告警）。
  const checked = createMemo(() => (inGroup() ? group?.value() === local.value : bridge.value()));
  const disabled = () =>
    Boolean(local.disabled) || (group?.disabled() ?? false) || (bridge.field?.disabled() ?? false);
  const size = () => local.size ?? group?.size() ?? 'medium';
  const status = () => local.status ?? bridge.field?.status() ?? 'default';
  const invalid = () => status() === 'error';
  const checkedState = (): SelectionChecked => (checked() ? 'true' : 'false');
  // 同 Checkbox：Group 内的 id 归自己，字段的 `ids.control` 由 Group 根承担，
  // 否则同组多个 radio 会重复同一个 id（T2-09 实测）。
  const controlId = () =>
    inGroup()
      ? (rest.id ?? `scui-radio-${uid}`)
      : (bridge.field?.aria().id ?? rest.id ?? `scui-radio-${uid}`);

  const commit = (next: boolean, event?: Event & { currentTarget: HTMLInputElement }) => {
    if (inGroup()) {
      // 原生 radio 没有「反选」：点已选中项不会触发 change，这里 next 恒为 true。
      if (!next) return;
      group?.write(local.value ?? '', event);
      local.onChange?.(true, event);
    } else {
      bridge.setValue(next, event);
    }
  };

  const shell = (): SelectionShellAttributes => ({
    class: classNames(`${CSS_PREFIX}radio`, local.class),
    'data-scui-role': 'radio',
    'data-scui-checked': checkedState(),
    'data-scui-size': size(),
    'data-scui-disabled': disabled() ? '' : undefined,
    'data-scui-invalid': invalid() ? 'true' : 'false',
  });

  return (
    <SelectionLabel
      shell={shell()}
      block={`${CSS_PREFIX}radio`}
      controlId={controlId()}
      indicator={<span class={`${CSS_PREFIX}radio__dot`} />}
      input={{
        ...rest,
        type: 'radio',
        name: inGroup() ? group?.name() : (rest.name ?? `scui-radio-${uid}`),
        value: local.value,
        checked: checked(),
        disabled: disabled(),
        'aria-checked': checkedState(),
        'aria-invalid': invalid() ? 'true' : 'false',
        // Group 内不注入字段 aria：id / aria-labelledby 归 Group 根，
        // 子控件靠自身 label 文案获得可访问名称，避免重复 id。
        ...(bridge.field && !inGroup() ? bridge.field.aria() : {}),
        onChange: (event) => {
          const target = event.currentTarget;
          commit(target.checked, event);
          if (group) {
            // 原生互斥会改到同组其他 input，只同步被点的一个会留下半截状态。
            syncRadioGroup(group.name(), group.value());
          } else {
            syncChecked(target, checked());
          }
        },
      }}
    >
      {local.children}
    </SelectionLabel>
  );
}
