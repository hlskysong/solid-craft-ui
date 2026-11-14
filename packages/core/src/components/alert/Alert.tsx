/**
 * 静态页内反馈条（T3-09）。
 *
 * 与 `Message` / `Notification` 的分工：后者是「由运行时队列驱动、会自己消失」
 * 的全局反馈，走 `components/app` 的静态 API；`Alert` 是页面里常驻的一段说明，
 * 由调用方决定何时存在，没有队列、没有定时器、没有 Portal。
 *
 * 无障碍：刻意**不加** `role="alert"` / `aria-live`。它是首屏静态内容，加 live
 * region 会让读屏在每次路由切换时重复播报；动态反馈的播报由 App 的 viewport
 * 负责（docs/06 §6）。状态不只靠颜色：四种类型各有不同的图形符号与文案位置，
 * 图形本身 `aria-hidden="true"`，语义由标题 / 描述承担（docs/03 §4.5）。
 *
 * 关闭是**非受控**的：组件自己移除 DOM 并发一次 `onClose`。不引入
 * `visible` 受控态，是因为调用方的真源应该直接决定是否渲染这段 JSX ——
 * 再加一层受控只会让「已经关掉的 Alert」继续占着组件树。
 */
import { createSignal, Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { AlertKind, AlertProps } from './types';

const ALERT_PROPS = [
  'kind',
  'title',
  'description',
  'closable',
  'closeLabel',
  'onClose',
  'action',
  'children',
  'icon',
  'class',
] as const;

/** 四种内置图形：同一 viewBox，靠 path 区分，颜色统一走 currentColor。 */
function KindIcon(props: { kind: AlertKind }): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5" />
      <Show when={props.kind === 'info'}>
        <path d="M10 9v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="10" cy="6.2" r="1" fill="currentColor" />
      </Show>
      <Show when={props.kind === 'success'}>
        <path
          d="m6.5 10.2 2.4 2.4 4.6-4.8"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </Show>
      <Show when={props.kind === 'warning'}>
        <path d="M10 5.8v5.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="10" cy="14.2" r="1" fill="currentColor" />
      </Show>
      <Show when={props.kind === 'error'}>
        <path
          d="m7.4 7.4 5.2 5.2m0-5.2-5.2 5.2"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </Show>
    </svg>
  );
}

function CloseIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
  );
}

export function Alert(props: AlertProps): JSX.Element {
  const [local, rest] = splitProps(props, ALERT_PROPS);
  const [visible, setVisible] = createSignal(true);

  const kind = (): AlertKind => local.kind ?? 'info';

  const close = (): void => {
    if (!visible()) return;
    setVisible(false);
    local.onClose?.();
  };

  return (
    <Show when={visible()}>
      <div
        {...rest}
        class={classNames(`${CSS_PREFIX}alert`, local.class)}
        data-scui-role="alert"
        data-scui-kind={kind()}
      >
        <Show when={local.icon !== null}>
          <span class={`${CSS_PREFIX}alert__icon`} data-scui-role="alert-icon">
            {local.icon ?? <KindIcon kind={kind()} />}
          </span>
        </Show>
        <div class={`${CSS_PREFIX}alert__body`} data-scui-role="alert-body">
          <Show when={local.title !== undefined}>
            <div class={`${CSS_PREFIX}alert__title`} data-scui-role="alert-title">
              {local.title}
            </div>
          </Show>
          <Show when={local.description !== undefined}>
            <div class={`${CSS_PREFIX}alert__description`} data-scui-role="alert-description">
              {local.description}
            </div>
          </Show>
          {local.children}
        </div>
        <Show when={local.action !== undefined}>
          <div class={`${CSS_PREFIX}alert__action`} data-scui-role="alert-action">
            {local.action}
          </div>
        </Show>
        <Show when={local.closable !== false}>
          <button
            type="button"
            class={`${CSS_PREFIX}alert__close`}
            data-scui-role="alert-close"
            aria-label={local.closeLabel ?? '关闭'}
            onClick={close}
          >
            <CloseIcon />
          </button>
        </Show>
      </div>
    </Show>
  );
}
