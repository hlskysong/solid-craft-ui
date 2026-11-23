import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface GraphStarProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: graph-star）。 */
export function GraphStar(props: GraphStarProps) {
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
      <path d="m12.342 9.316 1.764-3.527" />
      <path d="m12.59 14.545 2.35 3.759" />
      <path d="m13.982 12.332 4.03.447" />
      <path d="M5.414 17.586 8.88 14.12" />
      <path d="M9.025 9.742 5.317 5.505" />
      <circle cx="11" cy="12" r="3" />
      <circle cx="15" cy="4" r="2" />
      <circle cx="16" cy="20" r="2" />
      <circle cx="20" cy="13" r="2" />
      <circle cx="4" cy="19" r="2" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default GraphStar;
