import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface Axis3dProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: axis-3d）。 lucide 别名：axis-3-d。 */
export function Axis3d(props: Axis3dProps) {
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
      <path d="M13.5 10.5 15 9" />
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="M4.293 19.707 6 18" />
      <path d="m9 15 1.5-1.5" />
    </svg>
  );
}

export default Axis3d;
