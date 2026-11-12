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

/** 按 label 做大小写不敏感的本地匹配；空关键词表示不过滤。 */
function matchesQuery(label: string, keyword: string): boolean {
  const needle = keyword.trim().toLocaleLowerCase();
  return needle === '' || label.toLocaleLowerCase().includes(needle);
}

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
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
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
        itemComponent={(itemProps) => {
          const option = itemProps.item.rawValue;
          // 过滤只作用于条目渲染，collection 恒定 —— 换 options 数组会让 Kobalte
          // 重建状态并主动收起弹层（T2-07 实测）。hidden 让条目 DOM 仍在，
          // 键盘导航不会因找不到节点而断；data-scui-option 只标可见项。
          const shown = () => !props.hideOptions && matchesQuery(option.label, props.query ?? '');
          return (
            <KobalteSelect.Item
              item={itemProps.item}
              class={props.optionClass}
              hidden={!shown()}
              data-scui-option={shown() ? option.value : undefined}
            >
              <KobalteSelect.ItemLabel>{option.label}</KobalteSelect.ItemLabel>
              <KobalteSelect.ItemIndicator aria-hidden="true">✓</KobalteSelect.ItemIndicator>
            </KobalteSelect.Item>
          );
        }}
      >
        <KobalteSelect.Trigger
          {...props.triggerAttributes}
          class={props.triggerClass}
          data-scui-primitive="select-trigger"
        >
          {/* 展示文案以封装层的 selected() 为唯一真源，不依赖原语内部泛型推断 */}
          <KobalteSelect.Value>{chosenLabel}</KobalteSelect.Value>
          <KobalteSelect.Icon aria-hidden="true">▾</KobalteSelect.Icon>
        </KobalteSelect.Trigger>
        {props.triggerSuffix}
        {/* 同 Dialog：服务端与客户端首帧都不挂弹层，onMount 后才装载 */}
        <Show when={ready()}>
          <KobalteSelect.Portal>
            <KobalteSelect.Content class={props.contentClass} data-scui-primitive="select-content">
              {props.contentHeader}
              <KobalteSelect.Listbox />
              {props.contentFooter}
            </KobalteSelect.Content>
          </KobalteSelect.Portal>
        </Show>
        {/* 不挂 KobalteSelect.HiddenSelect：0.13.14 会在 aria-hidden="true" 容器里
            渲染 tabindex=0 的 input（用于代理焦点），axe 判定 aria-hidden-focus(serious)。
            这里用无焦点的原生隐藏字段承担表单提交，读屏语义仍由 Trigger / Listbox 提供。 */}
        <input type="hidden" name={props.name} value={current()} />
      </KobalteSelect>
    </div>
  );
}
