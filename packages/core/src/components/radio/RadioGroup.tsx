/**
 * 单选框组（T2-05）。
 *
 * 与 `CheckboxGroup` 共用值桥与 Context 形状，差别只在值域：这里是单个 `string`，
 * 空串表示「都未选」。方向键切换、互斥与表单提交由浏览器原生 radio 承担，
 * 前提是同组所有子项的 `name` 同源 —— 这是 Group 唯一必须自己负责的事。
 */
import { createUniqueId, For, Show, splitProps } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { RadioGroupContext } from '../selection/group-context';
import type { RadioGroupControl } from '../selection/selection-types';
import { useSelectionValue } from '../selection/use-selection-value';
import { Radio } from './Radio';
import type { RadioGroupProps } from './types';

/** 字段值是 `unknown`：只接受字符串，其余一律当「都未选」。 */
function toValue(raw: unknown): string {
  return typeof raw === 'string' ? raw : '';
}

export function RadioGroup(props: RadioGroupProps) {
  const [local, rest] = splitProps(props, [
    'value',
    'defaultValue',
    'onChange',
    'options',
    'disabled',
    'size',
    'orientation',
    'name',
    'class',
    'children',
  ]);

  const uid = createUniqueId();
  const bridge = useSelectionValue<string>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: () => local.onChange,
    fromField: toValue,
    fallback: () => '',
  });

  const disabled = () => Boolean(local.disabled) || (bridge.field?.disabled() ?? false);
  const size = () => local.size ?? 'medium';
  const name = () => local.name ?? `scui-radio-group-${uid}`;
  const invalid = () => (bridge.field?.status() ?? 'default') === 'error';

  const control: RadioGroupControl = {
    value: bridge.value,
    write: (next, event) => bridge.setValue(next, event),
    disabled,
    size,
    name,
  };

  return (
    <RadioGroupContext.Provider value={control}>
      <fieldset
        {...rest}
        // 字段的 id 三件套由 Group 根承担：label[for] / aria-labelledby /
        // aria-describedby 只有这一个目标，组内每个子控件用自己的唯一 id。
        {...(bridge.field ? bridge.field.aria() : {})}
        class={classNames(`${CSS_PREFIX}radio-group`, local.class)}
        data-scui-role="radio-group"
        data-scui-orientation={local.orientation ?? 'horizontal'}
        data-scui-size={size()}
        data-scui-disabled={disabled() ? '' : undefined}
        data-scui-invalid={invalid() ? 'true' : 'false'}
      >
        <Show when={local.options} fallback={local.children}>
          <For each={local.options}>
            {(option) => (
              <Radio value={option.value} disabled={option.disabled}>
                {option.label}
              </Radio>
            )}
          </For>
        </Show>
      </fieldset>
    </RadioGroupContext.Provider>
  );
}
