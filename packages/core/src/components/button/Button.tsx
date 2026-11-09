import { splitProps, Show } from 'solid-js';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { ButtonProps } from './types';

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    'variant',
    'color',
    'size',
    'block',
    'loading',
    'icon',
    'iconPosition',
    'shape',
    'htmlType',
    'class',
    'children',
    'disabled',
    'onClick',
  ]);

  const variant = () => local.variant ?? 'solid';
  const color = () => local.color ?? 'primary';
  const size = () => local.size ?? 'medium';
  const shape = () => local.shape ?? 'default';
  const disabled = () => local.disabled || local.loading;

  return (
    <button
      {...rest}
      type={local.htmlType ?? 'button'}
      class={classNames(`${CSS_PREFIX}button`, local.class)}
      data-size={size()}
      data-variant={variant()}
      data-color={color()}
      data-shape={shape()}
      data-block={local.block ? 'true' : undefined}
      data-loading={local.loading ? 'true' : undefined}
      disabled={disabled()}
      aria-busy={local.loading ? 'true' : undefined}
      onClick={(event) => {
        if (disabled()) return;

        const handler = local.onClick;
        if (!handler) return;
        if (typeof handler === 'function') {
          handler(event);
          return;
        }
        handler[0](handler[1], event);
      }}
    >
      <Show when={local.icon && local.iconPosition !== 'end'}>
        <span class={`${CSS_PREFIX}button__icon`}>{local.icon}</span>
      </Show>
      <span class={`${CSS_PREFIX}button__content`}>{local.children}</span>
      <Show when={local.icon && local.iconPosition === 'end'}>
        <span class={`${CSS_PREFIX}button__icon`}>{local.icon}</span>
      </Show>
    </button>
  );
}
