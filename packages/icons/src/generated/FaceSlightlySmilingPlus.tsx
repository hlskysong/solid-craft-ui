import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface FaceSlightlySmilingPlusProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: face-slightly-smiling-plus）。 lucide 别名：smile-plus。 */
export function FaceSlightlySmilingPlus(props: FaceSlightlySmilingPlusProps) {
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
      <path d="M13.267 2.08a10 10 0 108.653 8.653" />
      <path d="M15 10V9" />
      <path d="M16 5h6" />
      <path d="M16.472 15a6 6 0 01-8.943 0" />
      <path d="M19 2v6" />
      <path d="M9 10V9" />
    </svg>
  );
}

export default FaceSlightlySmilingPlus;
