/**
 * 多选框组（T2-05）。
 *
 * Group 本身不渲染任何 `<input>`：它只持有整组值、尺寸、禁用与 name，
 * 通过 `CheckboxGroupContext` 交给子项。这样「全选 / 反选」的业务逻辑
 * 只需在外部操作一个数组，不必给每个子项各挂一份监听。
 *
 * 值来源与单控件一致（字段 > `value` > `defaultValue`），所以 `<Form.Item>`
 * 包住 Group 时，整组值就是字段值；数组收窄只在这里做一次。
 */
import { createUniqueId, For, Show, splitProps } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { CheckboxGroupContext } from '../selection/group-context';
import type { CheckboxGroupControl } from '../selection/selection-types';
import { useSelectionValue } from '../selection/use-selection-value';
import { Checkbox } from './Checkbox';
import type { CheckboxGroupProps } from './types';

/** 字段值是 `unknown`：只接受字符串数组，其余一律当空组，不猜语义。 */
function toValues(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string');
}

export function CheckboxGroup(props: CheckboxGroupProps) {
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
  const bridge = useSelectionValue<string[]>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: () => local.onChange,
    fromField: toValues,
    fallback: () => [],
  });

  const disabled = () => Boolean(local.disabled) || (bridge.field?.disabled() ?? false);
  const size = () => local.size ?? 'medium';
  const name = () => local.name ?? `scui-checkbox-group-${uid}`;
  const invalid = () => (bridge.field?.status() ?? 'default') === 'error';

  const control: CheckboxGroupControl = {
    values: bridge.value,
    write: (next, event) => bridge.setValue(next, event),
    disabled,
    size,
    name,
  };

  return (
    <CheckboxGroupContext.Provider value={control}>
      <fieldset
        {...rest}
        class={classNames(`${CSS_PREFIX}checkbox-group`, local.class)}
        data-scui-role="checkbox-group"
        data-scui-orientation={local.orientation ?? 'horizontal'}
        data-scui-size={size()}
        data-scui-disabled={disabled() ? '' : undefined}
        data-scui-invalid={invalid() ? 'true' : 'false'}
      >
        <Show when={local.options} fallback={local.children}>
          <For each={local.options}>
            {(option) => (
              <Checkbox value={option.value} disabled={option.disabled}>
                {option.label}
              </Checkbox>
            )}
          </For>
        </Show>
      </fieldset>
    </CheckboxGroupContext.Provider>
  );
}
