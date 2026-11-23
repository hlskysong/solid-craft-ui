import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface TicketsPlaneProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: tickets-plane）。 */
export function TicketsPlane(props: TicketsPlaneProps) {
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
      <path d="M10.5 17h1.227a2 2 0 0 0 1.345-.52L18 12" />
      <path d="m12 13.5 3.794.506" />
      <path d="m3.173 8.18 11-5a2 2 0 0 1 2.647.993L18.56 8" />
      <path d="M6 10V8" />
      <path d="M6 14v1" />
      <path d="M6 19v2" />
      <rect x="2" y="8" width="20" height="13" rx="2" />
    </svg>
  );
}

export default TicketsPlane;
