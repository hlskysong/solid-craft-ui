/**
 * 单行输入框（T2-03）。
 *
 * 结构固定为「壳 + 控件 + 插槽」，插槽顺序与 DOM 顺序一致，避免视觉顺序与 Tab 顺序打架：
 * `prefix` → 控件 → 清除 → 密码切换 → `suffix` → 搜索按钮。
 *
 * 受控语义见 `use-input-value.ts`：被 `<Form.Item>` 包裹时字段是唯一数据源，
 * 控件自己传的 `value` 不再生效；`id` / `aria-*` 同理由字段注入（`T2-02` 的约定）。
 */
import { createSignal, Show, splitProps } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { ClearIcon, EyeIcon, EyeOffIcon, SearchIcon } from './input-icons';
import type { InputProps } from './types';
import { resolveStatus, useInputValue } from './use-input-value';

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    'value',
    'defaultValue',
    'onChange',
    'type',
    'size',
    'status',
    'prefix',
    'suffix',
    'allowClear',
    'onClear',
    'visibilityToggle',
    'onSearch',
    'enterButton',
    'class',
    'disabled',
    'onInput',
    'onKeyDown',
  ]);

  const bridge = useInputValue<HTMLInputElement>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: () => local.onChange,
  });

  const [passwordVisible, setPasswordVisible] = createSignal(false);
  let control: HTMLInputElement | undefined;

  const size = () => local.size ?? 'medium';
  const type = () => local.type ?? 'text';
  const disabled = () => Boolean(local.disabled) || (bridge.field?.disabled() ?? false);
  const invalid = () => resolveStatus(local.status, bridge.field) === 'error';
  const renderedType = () => (type() === 'password' && passwordVisible() ? 'text' : type());

  // 清除按钮只在「有值 + 允许清除 + 未禁用」时出现：禁用态还能点清除会让 rc 变成可写。
  const showClear = () => Boolean(local.allowClear) && bridge.value().length > 0 && !disabled();
  const showPasswordToggle = () =>
    type() === 'password' && (local.visibilityToggle ?? true) && !disabled();
  const showSearchButton = () => type() === 'search' && Boolean(local.enterButton) && !disabled();

  const focusControl = () => control?.focus();

  const clear = () => {
    local.onClear?.();
    bridge.setValue('');
    focusControl();
  };

  const search = () => {
    local.onSearch?.(bridge.value());
  };

  return (
    <span
      class={classNames(`${CSS_PREFIX}input`, local.class)}
      data-scui-role="input"
      data-scui-size={size()}
      data-scui-disabled={disabled() ? '' : undefined}
      data-scui-invalid={invalid() ? 'true' : 'false'}
    >
      <Show when={local.prefix}>
        <span class={`${CSS_PREFIX}input__prefix`}>{local.prefix}</span>
      </Show>

      <input
        {...rest}
        {...(bridge.field ? bridge.field.aria() : {})}
        ref={(element) => {
          control = element;
        }}
        class={`${CSS_PREFIX}input__control`}
        type={renderedType()}
        value={bridge.value()}
        disabled={disabled()}
        aria-invalid={invalid() ? 'true' : 'false'}
        onInput={(event) => {
          bridge.setValue(event.currentTarget.value, event);

          const handler = local.onInput;
          if (!handler) return;
          if (typeof handler === 'function') handler(event);
          else handler[0](handler[1], event);
        }}
        onKeyDown={(event) => {
          const handler = local.onKeyDown;
          if (handler) {
            if (typeof handler === 'function') handler(event);
            else handler[0](handler[1], event);
          }

          // 输入法组合态下的回车是「上屏」，不是提交搜索。
          if (type() !== 'search' || event.key !== 'Enter' || event.isComposing) return;
          if (event.defaultPrevented) return;
          search();
        }}
      />

      <Show when={showClear()}>
        <button
          type="button"
          class={`${CSS_PREFIX}input__clear`}
          data-scui-role="input-clear"
          aria-label="清除"
          tabIndex={-1}
          onClick={clear}
        >
          <ClearIcon />
        </button>
      </Show>

      <Show when={showPasswordToggle()}>
        <button
          type="button"
          class={`${CSS_PREFIX}input__toggle`}
          data-scui-role="input-password-toggle"
          aria-label={passwordVisible() ? '隐藏密码' : '显示密码'}
          aria-pressed={passwordVisible() ? 'true' : 'false'}
          tabIndex={-1}
          onClick={() => setPasswordVisible((previous) => !previous)}
        >
          {passwordVisible() ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </Show>

      <Show when={local.suffix}>
        <span class={`${CSS_PREFIX}input__suffix`}>{local.suffix}</span>
      </Show>

      <Show when={showSearchButton()}>
        <button
          type="button"
          class={`${CSS_PREFIX}input__search`}
          data-scui-role="input-search"
          aria-label="搜索"
          onClick={search}
        >
          {local.enterButton === true ? <SearchIcon /> : local.enterButton}
        </button>
      </Show>
    </span>
  );
}
