/**
 * S-02 可行性预研：Kobalte 0.13 Select 封装。
 *
 * 只验证「样式覆盖 + 键盘 + 焦点 + SSR 无报错」是否可行，不是正式组件：
 * 目录在 packages/core/spikes/ 下，不进 src/、不进 dist/、不进 npm 包。
 * 状态一律用 data-* 表达，类名只用 CSS_PREFIX 单点派生的静态类名。
 *
 * Spike 实测结论（写进 api-draft/Select.md 供 T0-03 评审）：
 *  - Kobalte 0.13 没有 optionLabel，只有 optionTextValue（typeahead 用）；
 *  - 受控 value 是「整个 option 对象」，optionValue 只作用于 hidden <select> 提交值；
 *  - jsdom 下原语不响应 click / keydown / pointer* 的选中链路（真实浏览器才生效），
 *    因此封装层自己接管 open 键盘切换与选中回调，保留原语的 aria / data-* / 焦点陷阱。
 */
import { Select as KobalteSelect } from '@kobalte/core/select';
import { createMemo, createSignal, type JSX, splitProps } from 'solid-js';

import { CSS_PREFIX } from '../../src/scope';
import { classNames } from '../../src/utils/class-names';
import { resolveValue, type MaybeAccessor } from '../../src/utils/resolve-value';

export interface SelectOption {
  /** 选项值。 */
  value: string;
  /** 展示文案。 */
  label: string;
  /** 是否禁用。 @default false */
  disabled?: boolean;
}

export interface ScuiSelectProps {
  /** 选项列表；值 / Accessor / getter 均可（响应式契约）。 */
  options: MaybeAccessor<readonly SelectOption[]>;
  /** 当前值；值 / getter 均可。 @default undefined */
  value?: MaybeAccessor<string | undefined>;
  /** 值变化回调。 */
  onChange?: (value: string) => void;
  /** 占位文案。 @default '请选择' */
  placeholder?: string;
  /** 禁用态。 @default false */
  disabled?: MaybeAccessor<boolean>;
  /** 尺寸，只用 small | medium | large。 @default 'medium' */
  size?: 'small' | 'medium' | 'large';
  /** 无障碍标签。 */
  'aria-label'?: string;
}

export function ScuiSelect(props: ScuiSelectProps): JSX.Element {
  const [local] = splitProps(props, ['size']);
  const options = createMemo(() => resolveValue(props.options));
  const disabled = createMemo(() => resolveValue(props.disabled ?? false) === true);
  const size = createMemo(() => local.size ?? 'medium');
  const [internalValue, setInternalValue] = createSignal('');
  const [open, setOpen] = createSignal(false);
  const currentValue = createMemo(() => resolveValue(props.value) ?? internalValue());
  const selected = createMemo(
    () => options().find((item) => item.value === currentValue()) ?? null,
  );

  const choose = (value: string) => {
    if (disabled() || value === '' || value === currentValue()) return;
    if (resolveValue(props.value) === undefined) setInternalValue(value);
    setOpen(false);
    props.onChange?.(value);
  };

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (disabled()) return;
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    // 键盘事件在容器层捕获：Kobalte Trigger 会独占自身的 onKeyDown，冒泡到外层才稳。
    // fieldset 自带 group 语义，避免在静态 div 上硬挂 role / 事件处理器
    <fieldset
      class={classNames(`${CSS_PREFIX}select-wrapper`)}
      aria-label={props['aria-label'] ?? '请选择'}
      onKeyDown={onTriggerKeyDown}
    >
      <KobalteSelect<SelectOption>
      class={classNames(`${CSS_PREFIX}select`)}
      options={[...options()]}
      value={selected()}
      open={open()}
      onOpenChange={setOpen}
      onChange={(option) => choose(option?.value ?? '')}
      disabled={disabled()}
      placeholder={props.placeholder ?? '请选择'}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      aria-label={props['aria-label'] ?? '请选择'}
      data-scui-size={size()}
      data-scui-disabled={disabled() ? '' : undefined}
      itemComponent={(itemProps) => (
        <KobalteSelect.Item
          item={itemProps.item}
          data-scui-option={itemProps.item.rawValue.value}
          onClick={() => {
            if (!itemProps.item.rawValue.disabled) choose(itemProps.item.rawValue.value);
          }}
          onKeyDown={(event: KeyboardEvent) => {
            if (['Enter', ' '].includes(event.key) && !itemProps.item.rawValue.disabled) {
              event.preventDefault();
              choose(itemProps.item.rawValue.value);
            }
          }}
        >
          <KobalteSelect.ItemLabel>{itemProps.item.rawValue.label}</KobalteSelect.ItemLabel>
          <KobalteSelect.ItemIndicator aria-hidden="true">✓</KobalteSelect.ItemIndicator>
        </KobalteSelect.Item>
      )}
    >
      <KobalteSelect.Trigger
        class={classNames(`${CSS_PREFIX}select-trigger`)}
        data-scui-size={size()}
      >
        {/* 展示文案以封装层的 selected() 为唯一真源，不依赖原语内部泛型推断 */}
        <KobalteSelect.Value>
          {() => selected()?.label ?? props.placeholder ?? '请选择'}
        </KobalteSelect.Value>
        <KobalteSelect.Icon aria-hidden="true">▾</KobalteSelect.Icon>
      </KobalteSelect.Trigger>
      <KobalteSelect.Portal>
        <KobalteSelect.Content class={classNames(`${CSS_PREFIX}select-content`)}>
          <KobalteSelect.Listbox />
        </KobalteSelect.Content>
      </KobalteSelect.Portal>
        <KobalteSelect.HiddenSelect />
      </KobalteSelect>
    </fieldset>
  );
}
