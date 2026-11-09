import { children, For, Show, splitProps } from 'solid-js';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { SpaceProps } from './types';

export function Space(props: SpaceProps) {
  const [local, rest] = splitProps(props, [
    'direction',
    'size',
    'wrap',
    'align',
    'split',
    'class',
    'children',
  ]);
  const resolved = children(() => local.children);

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}space`, local.class)}
      data-direction={local.direction ?? 'horizontal'}
      data-size={local.size ?? 'medium'}
      data-wrap={local.wrap ? 'true' : undefined}
      data-align={local.align}
    >
      <For each={resolved.toArray()}>
        {(child, index) => (
          <>
            <Show when={local.split !== undefined && index() > 0}>
              <span class={`${CSS_PREFIX}space__split`}>{local.split}</span>
            </Show>
            {child}
          </>
        )}
      </For>
    </div>
  );
}
