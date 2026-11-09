import { Show, splitProps } from 'solid-js';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { DividerProps } from './types';

export function Divider(props: DividerProps) {
  const [local, rest] = splitProps(props, ['orientation', 'dashed', 'plain', 'class', 'children']);
  const orientation = () => local.orientation ?? 'horizontal';

  return (
    // biome-ignore lint/a11y/useSemanticElements: <hr> 无法承载分割线文字，按组件契约使用 div + role
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}divider`, local.class)}
      role="separator"
      aria-orientation={orientation()}
      data-orientation={orientation()}
      data-dashed={local.dashed ? 'true' : undefined}
      data-plain={local.plain ? 'true' : undefined}
      data-has-text={local.children ? 'true' : undefined}
    >
      <Show when={local.children}>
        <span class={`${CSS_PREFIX}divider__text`}>{local.children}</span>
      </Show>
    </div>
  );
}
