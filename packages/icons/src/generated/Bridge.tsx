import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface BridgeProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: bridge）。 */
export function Bridge(props: BridgeProps) {
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
      <path d="M10 9.728V16" />
      <path d="M14 9.728V16" />
      <path d="M18 20V4" />
      <path d="m22 11-4-4A7.5 7.5 0 0 1 6 7l-4 4" />
      <path d="M22 16H2" />
      <path d="M6 20V4" />
    </svg>
  );
}

export default Bridge;
