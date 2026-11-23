import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface WaypointsProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: waypoints）。 */
export function Waypoints(props: WaypointsProps) {
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
      <path d="m10.586 5.414-5.172 5.172" />
      <path d="m18.586 13.414-5.172 5.172" />
      <path d="M6 12h12" />
      <circle cx="12" cy="20" r="2" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="20" cy="12" r="2" />
      <circle cx="4" cy="12" r="2" />
    </svg>
  );
}

export default Waypoints;
