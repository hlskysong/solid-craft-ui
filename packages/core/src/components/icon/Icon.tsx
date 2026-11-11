import { splitProps } from 'solid-js';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { IconProps } from './types';

export function Icon(props: IconProps) {
  const [local, rest] = splitProps(props, ['size', 'tone', 'spin', 'label', 'class', 'children']);

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: label 存在时动态设置 role="img"
    <span
      {...rest}
      class={classNames(`${CSS_PREFIX}icon`, local.class)}
      data-scui-size={local.size ?? 'medium'}
      data-scui-tone={local.tone}
      data-scui-spin={local.spin ? 'true' : undefined}
      role={local.label ? 'img' : undefined}
      aria-label={local.label}
      aria-hidden={local.label ? undefined : 'true'}
    >
      {local.children}
    </span>
  );
}
