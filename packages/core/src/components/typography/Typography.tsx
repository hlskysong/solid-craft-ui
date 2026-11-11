import { splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { LinkProps, TitleProps, TypographyProps } from './types';

export function Text(props: TypographyProps) {
  const [local, rest] = splitProps(props, [
    'tone',
    'size',
    'bold',
    'ellipsis',
    'code',
    'mark',
    'delete',
    'underline',
    'class',
    'children',
  ]);

  return (
    <span
      {...rest}
      class={classNames(`${CSS_PREFIX}typography`, local.class)}
      data-scui-type="text"
      data-scui-tone={local.tone}
      data-scui-size={local.size ?? 'medium'}
      data-scui-bold={local.bold ? 'true' : undefined}
      data-scui-ellipsis={local.ellipsis ? 'true' : undefined}
      data-scui-code={local.code ? 'true' : undefined}
      data-scui-mark={local.mark ? 'true' : undefined}
      data-scui-delete={local.delete ? 'true' : undefined}
      data-scui-underline={local.underline ? 'true' : undefined}
    >
      {local.children}
    </span>
  );
}

export function Title(props: TitleProps) {
  const [local, rest] = splitProps(props, [
    'level',
    'tone',
    'size',
    'bold',
    'ellipsis',
    'code',
    'mark',
    'delete',
    'underline',
    'class',
    'children',
  ]);

  const level = () => local.level ?? 1;
  const component = () => `h${level()}`;

  return (
    <Dynamic
      component={component()}
      {...rest}
      class={classNames(`${CSS_PREFIX}typography`, local.class)}
      data-scui-type="title"
      data-scui-level={String(level())}
      data-scui-tone={local.tone}
      data-scui-size={local.size ?? 'medium'}
      data-scui-bold={local.bold ? 'true' : undefined}
      data-scui-ellipsis={local.ellipsis ? 'true' : undefined}
      data-scui-code={local.code ? 'true' : undefined}
      data-scui-mark={local.mark ? 'true' : undefined}
      data-scui-delete={local.delete ? 'true' : undefined}
      data-scui-underline={local.underline ? 'true' : undefined}
    >
      {local.children}
    </Dynamic>
  );
}

export function Paragraph(props: TypographyProps) {
  const [local, rest] = splitProps(props, [
    'tone',
    'size',
    'bold',
    'ellipsis',
    'code',
    'mark',
    'delete',
    'underline',
    'class',
    'children',
  ]);

  return (
    <p
      {...rest}
      class={classNames(`${CSS_PREFIX}typography`, local.class)}
      data-scui-type="paragraph"
      data-scui-tone={local.tone}
      data-scui-size={local.size ?? 'medium'}
      data-scui-bold={local.bold ? 'true' : undefined}
      data-scui-ellipsis={local.ellipsis ? 'true' : undefined}
      data-scui-code={local.code ? 'true' : undefined}
      data-scui-mark={local.mark ? 'true' : undefined}
      data-scui-delete={local.delete ? 'true' : undefined}
      data-scui-underline={local.underline ? 'true' : undefined}
    >
      {local.children}
    </p>
  );
}

export function Link(props: LinkProps) {
  const [local, rest] = splitProps(props, [
    'href',
    'target',
    'rel',
    'tone',
    'size',
    'bold',
    'ellipsis',
    'code',
    'mark',
    'delete',
    'underline',
    'class',
    'children',
  ]);

  const href = () => {
    const value = local.href;
    if (value === undefined) return undefined;
    return /^\s*javascript:/i.test(value) ? undefined : value;
  };
  const rel = () => local.rel ?? (local.target === '_blank' ? 'noopener noreferrer' : undefined);

  return (
    <a
      {...rest}
      href={href()}
      target={local.target}
      rel={rel()}
      class={classNames(`${CSS_PREFIX}typography`, local.class)}
      data-scui-type="link"
      data-scui-tone={local.tone}
      data-scui-size={local.size ?? 'medium'}
      data-scui-bold={local.bold ? 'true' : undefined}
      data-scui-ellipsis={local.ellipsis ? 'true' : undefined}
      data-scui-code={local.code ? 'true' : undefined}
      data-scui-mark={local.mark ? 'true' : undefined}
      data-scui-delete={local.delete ? 'true' : undefined}
      data-scui-underline={local.underline ? 'true' : undefined}
    >
      {local.children}
    </a>
  );
}
