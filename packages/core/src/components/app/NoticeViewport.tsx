import { createMemo, For, Show, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import type { NoticeStore } from './notice-store';
import type { NoticeChannel, NoticePlacement } from './types';

/** 反馈容器：一个通道一个，按 `data-scui-role` 区分，不生成 modifier class。 */
export interface NoticeViewportProps {
  store: NoticeStore;
  channel: NoticeChannel;
  placement: NoticePlacement;
}

export function NoticeViewport(props: NoticeViewportProps): JSX.Element {
  const items = createMemo(() =>
    props.store.items().filter((item) => item.channel === props.channel),
  );
  const isMessage = () => props.channel === 'message';

  return (
    <div
      class={`${CSS_PREFIX}app-viewport`}
      data-scui-role={isMessage() ? 'message-viewport' : 'notification-viewport'}
      data-scui-placement={props.placement}
      aria-live={isMessage() ? 'polite' : 'assertive'}
      aria-atomic="false"
    >
      <For each={items()}>
        {(item) => (
          <div
            class={`${CSS_PREFIX}app-notice`}
            data-scui-role={isMessage() ? 'message' : 'notification'}
            data-scui-kind={item.kind}
            role={isMessage() ? 'status' : 'alert'}
          >
            <span class={`${CSS_PREFIX}app-notice__icon`} aria-hidden="true">
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <circle cx="8" cy="8" r="6" fill="currentColor" />
              </svg>
            </span>
            <div class={`${CSS_PREFIX}app-notice__body`}>
              <div class={`${CSS_PREFIX}app-notice__content`}>{item.content}</div>
              <Show when={item.description}>
                <div class={`${CSS_PREFIX}app-notice__description`}>{item.description}</div>
              </Show>
            </div>
            <Show when={item.closable}>
              <button
                type="button"
                class={`${CSS_PREFIX}app-notice__close`}
                aria-label="关闭通知"
                onClick={() => props.store.remove(item.id)}
              >
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path
                    d="M4 4 L12 12 M12 4 L4 12"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                  />
                </svg>
              </button>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
