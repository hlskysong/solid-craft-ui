import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface GermProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: germ）。 */
export function Germ(props: GermProps) {
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
      <path d="m11 2 .925 1.848" />
      <path d="M13 15h.01" />
      <path d="m16 21-1-2.472" />
      <path d="m19 2-1 1.804" />
      <path d="m2 19 2.746-1.373" />
      <path d="m22 16-2.474-2.13" />
      <path d="m22 5-1.804 1" />
      <path d="m3 10 2 2" />
      <path d="M9 16h.01" />
      <path d="M9 20v2" />
      <path d="M9.33 7.035c-.51 1.478-1.786 2.93-3.09 3.794A5 5 0 009 20a12.1 12.1 0 0011.902-9.916A6 6 0 009.33 7.035" />
      <circle cx="15" cy="9" r="2" />
    </svg>
  );
}

export default Germ;
