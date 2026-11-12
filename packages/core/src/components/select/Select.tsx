/**
 * 选择器（T2-07）。
 *
 * 分层：行为与 A11y 全在 `src/primitives/select.tsx`（Kobalte 的键盘 / typeahead /
 * Portal 定位，内部由 `@floating-ui/dom` 驱动）；本文件只负责值桥、本地搜索、
 * 清除 / 空态 / 加载三个插槽、以及 `data-scui-*` 状态契约与视觉类名。
 * 原语不产出业务文案与样式，上层不 import 第三方组件 —— 接缝只有 DOM 插槽与类名钩子。
 *
 * SSR：弹层（含搜索框 / 空态）由原语的 `useClientReady()` 在 `onMount` 后才装载，
 * 服务端只输出触发器与隐藏的原生 `<select>` 骨架；`data-scui-invalid` 恒输出两态，
 * `data-scui-open` / `-disabled` / `-loading` 都是「存在即真」且首帧一致。
 */
import { createMemo, createSignal, Show, splitProps, type JSX } from 'solid-js';

import { toFieldText } from '../../form/field-value';
import { PrimitiveSelect } from '../../primitives/select';
import type { PrimitiveOption } from '../../primitives/types';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { resolveValue } from '../../utils/resolve-value';
import { useSelectionValue } from '../selection/use-selection-value';
import type { SelectOption, SelectProps } from './types';

export function Select(props: SelectProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'options',
    'value',
    'defaultValue',
    'onChange',
    'placeholder',
    'disabled',
    'loading',
    'searchable',
    'clearable',
    'size',
    'status',
    'aria-label',
    'name',
    'searchPlaceholder',
    'emptyText',
    'loadingText',
    'clearLabel',
    'class',
  ]);

  // 与其它控件同一套值优先级：字段上下文 > value > defaultValue / 内部信号。
  const bridge = useSelectionValue<string>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    // 值桥的回调是「值 + 原生 change 事件」两参；Select 没有原生 change 事件，
    // 公共契约是单参，包一层避免把第二个 undefined 透给消费方。
    onChange: () => (local.onChange ? (next: string) => local.onChange?.(next) : undefined),
    fromField: (raw) => toFieldText(raw),
    fallback: () => '',
  });

  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal('');

  const current = createMemo(() => bridge.value());
  const loading = createMemo(() => Boolean(resolveValue(local.loading ?? false)));
  const disabled = createMemo(
    () => Boolean(resolveValue(local.disabled ?? false)) || (bridge.field?.disabled() ?? false),
  );
  const size = () => local.size ?? 'medium';
  const status = () => local.status ?? bridge.field?.status() ?? 'default';
  const invalid = () => status() === 'error';

  const allOptions = createMemo<readonly SelectOption[]>(() => resolveValue(local.options));
  // 传给 Kobalte 的 collection 只随业务 options 变化，**不随搜索词变化**：
  // 换数组会让 Kobalte 重建状态并主动收起弹层（T2-07 实测）。空列表补一个哨兵项，
  // 保证 collection 非空、ArrowDown 仍能展开，否则空态 / 加载提示没有容器可挂。
  const source = createMemo<PrimitiveOption[]>(() => {
    const list = allOptions().map((item) => ({
      value: item.value,
      label: item.label,
      disabled: item.disabled,
    }));
    return list.length === 0 ? [{ value: '\u0000', label: '', disabled: true }] : list;
  });
  // 过滤结果只用于「有没有匹配项」的计数；条目显隐由原语按 query 判定。
  const matched = createMemo<number>(() => {
    const keyword = query().trim().toLocaleLowerCase();
    return keyword === ''
      ? allOptions().length
      : allOptions().filter((item) => item.label.toLocaleLowerCase().includes(keyword)).length;
  });
  const showStatus = () => loading() || matched() === 0;

  const label = () => local['aria-label'] ?? local.placeholder ?? '请选择';
  const searchLabel = () => local.searchPlaceholder ?? '搜索';
  const triggerAttributes = (): JSX.HTMLAttributes<HTMLButtonElement> => ({
    ...bridge.field?.aria(),
    'aria-invalid': invalid() ? 'true' : 'false',
  });

  const clear = () => {
    bridge.setValue('');
    setQuery('');
  };

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}select`, local.class)}
      data-scui-role="select"
      data-scui-size={size()}
      data-scui-invalid={invalid() ? 'true' : 'false'}
      data-scui-disabled={disabled() ? '' : undefined}
      data-scui-loading={loading() ? '' : undefined}
      data-scui-open={open() ? '' : undefined}
      aria-busy={loading() ? 'true' : undefined}
    >
      <PrimitiveSelect
        class={`${CSS_PREFIX}select__control`}
        triggerClass={`${CSS_PREFIX}select__trigger`}
        contentClass={`${CSS_PREFIX}select__content`}
        optionClass={`${CSS_PREFIX}select__option`}
        triggerAttributes={triggerAttributes()}
        triggerSuffix={
          <Show when={local.clearable && !disabled() && current() !== ''}>
            <button
              type="button"
              class={`${CSS_PREFIX}select__clear`}
              data-scui-role="select-clear"
              aria-label={local.clearLabel ?? '清除'}
              onClick={(event) => {
                event.stopPropagation();
                clear();
              }}
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </Show>
        }
        contentHeader={
          <Show when={local.searchable}>
            <input
              class={`${CSS_PREFIX}select__search`}
              data-scui-role="select-search"
              type="search"
              value={query()}
              placeholder={searchLabel()}
              aria-label={searchLabel()}
              disabled={loading()}
              onInput={(event) => {
                event.stopPropagation();
                setQuery(event.currentTarget.value);
              }}
              onKeyDown={(event) => event.stopPropagation()}
            />
          </Show>
        }
        contentFooter={
          <Show when={showStatus()}>
            <div
              class={`${CSS_PREFIX}select__status`}
              data-scui-role={loading() ? 'select-loading' : 'select-empty'}
              role="status"
            >
              {loading() ? (local.loadingText ?? '加载中') : (local.emptyText ?? '无匹配结果')}
            </div>
          </Show>
        }
        options={source()}
        query={query()}
        hideOptions={showStatus()}
        value={current()}
        placeholder={local.placeholder ?? '请选择'}
        disabled={disabled()}
        name={local.name}
        aria-label={label()}
        onChange={(next) => {
          bridge.setValue(next);
          setQuery('');
        }}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery('');
        }}
      />
    </div>
  );
}
