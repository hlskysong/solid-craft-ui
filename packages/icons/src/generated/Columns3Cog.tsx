import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface Columns3CogProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: columns-3-cog）。 lucide 别名：columns-settings / table-config。 */
export function Columns3Cog(props: Columns3CogProps) {
  const [local, rest] = splitProps(props, ['size', 'strokeWidth']);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={local.size ?? '1em'}
      height={local.size ?? '1em'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={local.strokeWidth ?? 1.75}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="M10.6 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5.6" />
      <path d="m14.305 19.53.923-.382" />
      <path d="M15 3v7.6" />
      <path d="m15.229 16.852-.924-.383" />
      <path d="m16.852 15.228-.383-.923" />
      <path d="m16.852 20.772-.383.924" />
      <path d="m19.148 15.228.383-.923" />
      <path d="m19.53 21.696-.382-.924" />
      <path d="m20.773 16.852.922-.383" />
      <path d="m20.773 19.148.922.383" />
      <path d="M9 3v18" />
      <circle cx="18" cy="18" r="3" />
    </svg>
  );
}

export default Columns3Cog;
