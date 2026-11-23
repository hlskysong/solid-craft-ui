import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface Rotate3dProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: rotate-3d）。 lucide 别名：rotate-3-d。 */
export function Rotate3d(props: Rotate3dProps) {
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
      <path d="m15.194 13.707 3.814 1.86-1.86 3.814" />
      <path d="M16.47214 7.52786 A 5 10 0 1 0 13 21.79796" />
      <path d="M21.79796 11 A 10 5 0 1 0 19 15.57071" />
    </svg>
  );
}

export default Rotate3d;
