import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface CupcakeProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: cupcake）。 */
export function Cupcake(props: CupcakeProps) {
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
      <path d="M12 22v-9" />
      <path d="M14 4h1a3 3 0 013 3l-.004.125A4 4 0 0121 11v2" />
      <path d="m15.5 22 1.5-9" />
      <path d="M21 13a1 1 0 01.919 1.394l-2.74 6.394A2 2 0 0117.34 22H6.659a2 2 0 01-1.838-1.212l-2.74-6.394A1 1 0 013 13z" />
      <path d="M3 13v-2a4 4 0 013.003-3.875L6 7a3 3 0 013-3h1" />
      <path d="M8.5 22 7 13" />
      <circle cx="12" cy="4" r="2" />
    </svg>
  );
}

export default Cupcake;
