import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface SquareDashedXCornerProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: square-dashed-x-corner）。 */
export function SquareDashedXCorner(props: SquareDashedXCornerProps) {
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
      <path d="M14 3h1" />
      <path d="m16 16 5 5" />
      <path d="M19 3a2 2 0 012 2" />
      <path d="m21 16-5 5" />
      <path d="M21 9v1" />
      <path d="M3 14v1" />
      <path d="M3 9v1" />
      <path d="M5 21a2 2 0 01-2-2" />
      <path d="M5 3a2 2 0 00-2 2" />
      <path d="M9 21h1" />
      <path d="M9 3h1" />
    </svg>
  );
}

export default SquareDashedXCorner;
