import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface LaserProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: laser）。 */
export function Laser(props: LaserProps) {
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
      <path d="m13 8 .95-.95" />
      <path d="M13.95 16.95 13 16" />
      <path d="M22 12h-9" />
      <path d="M4 12H2" />
      <path d="M4.05 16.95 5 16" />
      <path d="m5 8-.95-.95" />
      <path d="M9 12h.01" />
      <path d="M9 19v-2" />
      <path d="M9 7V5" />
    </svg>
  );
}

export default Laser;
