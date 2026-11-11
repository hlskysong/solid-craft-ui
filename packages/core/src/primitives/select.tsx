/**
 * 选择器原语（T2-01）。
 *
 * R2 = A 的落点在这里：对外 `value` 是字符串，Kobalte「受控值必须是整个 option 对象」
 * 的约束被本文件双向映射吸收，上层组件与消费方都看不到 option 对象。
 *
 * 键盘 / typeahead / 焦点 / 选中链路全部交给原语，封装层**不接管**。
 * S-02 当初推断「jsdom 下原语不响应交互」，T2-01 实测证伪：ArrowDown 打开、
 * 选项 Enter 选中都能走通（记录见 `docs/08 §30.16`）。接管反而会与原语状态机
 * 双重 toggle —— 先被我们打开、随即被原语自己的 `toggle()` 关掉。
 *
 * 只保留两处适配：
 *  1. `optionTextValue`（Kobalte 0.13 没有 `optionLabel`，typeahead 用它）；
 *  2. `value` 的 string ↔ option 对象映射（R2 契约）。
 */
import { Select as KobalteSelect } from '@kobalte/core/select';
import { createMemo, createSignal, Show, type JSX } from 'solid-js';

import { resolveValue } from '../utils/resolve-value';
import type { PrimitiveOption, PrimitiveSelectProps } from './types';
import { useClientReady } from './use-client-ready';

export function PrimitiveSelect(props: PrimitiveSelectProps): JSX.Element {
  const ready = useClientReady();
  const options = createMemo(() => resolveValue(props.options));
  const disabled = createMemo(() => resolveValue(props.disabled ?? false));
  const placeholder = createMemo(() => resolveValue(props.placeholder) ?? '请选择');
  const controlled = createMemo(() => resolveValue(props.value));
  const label = () => props['aria-label'] ?? placeholder();

  const [draft, setDraft] = createSignal('');
  const [open, setOpen] = createSignal(false);
  const current = createMemo(() => controlled() ?? draft());
  const selected = createMemo(() => options().find((item) => item.value === current()) ?? null);
  const chosenLabel = () => selected()?.label ?? placeholder();

  return (
    <div
      class={props.class}
      data-scui-primitive="select"
      data-scui-state={open() ? 'open' : 'closed'}
      data-scui-disabled={disabled() ? '' : undefined}
    >
      <KobalteSelect<PrimitiveOption>
        options={[...options()]}
        value={selected()}
        open={open()}
        onOpenChange={setOpen}
        onChange={(option) => {
          const next = option?.value ?? '';
          // 受控模式只通知、不写内部状态；非受控才落 draft
          if (controlled() === undefined && next !== '') setDraft(next);
          props.onChange?.(next);
        }}
        disabled={disabled()}
        placeholder={placeholder()}
        optionValue="value"
        optionTextValue="label"
        optionDisabled="disabled"
        aria-label={label()}
        itemComponent={(itemProps) => (
          <KobalteSelect.Item
            item={itemProps.item}
            data-scui-option={itemProps.item.rawValue.value}
          >
            <KobalteSelect.ItemLabel>{itemProps.item.rawValue.label}</KobalteSelect.ItemLabel>
            <KobalteSelect.ItemIndicator aria-hidden="true">✓</KobalteSelect.ItemIndicator>
          </KobalteSelect.Item>
        )}
      >
        <KobalteSelect.Trigger data-scui-primitive="select-trigger">
          {/* 展示文案以封装层的 selected() 为唯一真源，不依赖原语内部泛型推断 */}
          <KobalteSelect.Value>{chosenLabel}</KobalteSelect.Value>
          <KobalteSelect.Icon aria-hidden="true">▾</KobalteSelect.Icon>
        </KobalteSelect.Trigger>
        {/* 同 Dialog：服务端与客户端首帧都不挂弹层，onMount 后才装载 */}
        <Show when={ready()}>
          <KobalteSelect.Portal>
            <KobalteSelect.Content data-scui-primitive="select-content">
              <KobalteSelect.Listbox />
            </KobalteSelect.Content>
          </KobalteSelect.Portal>
        </Show>
        <KobalteSelect.HiddenSelect />
      </KobalteSelect>
    </div>
  );
}
