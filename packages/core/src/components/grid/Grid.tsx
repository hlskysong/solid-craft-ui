import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { ColProps, RowProps } from './types';

const SPAN_MIN = 1;
const SPAN_MAX = 24;

function clampSpan(value: number | undefined, fallback = SPAN_MAX): number {
  if (value === undefined) return fallback;
  return Math.min(SPAN_MAX, Math.max(SPAN_MIN, value));
}

function clampOffset(value: number | undefined): number {
  if (value === undefined) return 0;
  return Math.min(SPAN_MAX, Math.max(0, value));
}

export function Row(props: RowProps) {
  const [local, rest] = splitProps(props, [
    'gutter',
    'align',
    'justify',
    'wrap',
    'class',
    'children',
  ]);

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}row`, local.class)}
      data-gutter={local.gutter ?? 'medium'}
      data-align={local.align}
      data-justify={local.justify}
      data-wrap={(local.wrap ?? true) ? 'true' : 'false'}
    >
      {local.children}
    </div>
  );
}

export function Col(props: ColProps) {
  const [local, rest] = splitProps(props, [
    'span',
    'offset',
    'order',
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    'xxl',
    'class',
    'children',
  ]);

  const colStyle = (): JSX.CSSProperties => {
    const style: JSX.CSSProperties = {
      '--scui-col-span': String(clampSpan(local.span)),
      '--scui-col-offset': String(clampOffset(local.offset)),
      '--scui-col-order': String(local.order ?? 0),
    };

    if (local.xs !== undefined) style['--scui-col-span-xs'] = String(clampSpan(local.xs));
    if (local.sm !== undefined) style['--scui-col-span-sm'] = String(clampSpan(local.sm));
    if (local.md !== undefined) style['--scui-col-span-md'] = String(clampSpan(local.md));
    if (local.lg !== undefined) style['--scui-col-span-lg'] = String(clampSpan(local.lg));
    if (local.xl !== undefined) style['--scui-col-span-xl'] = String(clampSpan(local.xl));
    if (local.xxl !== undefined) style['--scui-col-span-xxl'] = String(clampSpan(local.xxl));

    return style;
  };

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}col`, local.class)}
      data-span={String(clampSpan(local.span))}
      data-offset={String(clampOffset(local.offset))}
      style={colStyle()}
    >
      {local.children}
    </div>
  );
}
