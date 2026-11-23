import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface BroomSparklesProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: broom-sparkles）。 */
export function BroomSparkles(props: BroomSparklesProps) {
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
      <path d="M11 2v2" />
      <path d="M12 3h-2" />
      <path d="M13.5 10.5 22 2" />
      <path d="M14.734 13.841a2 2 0 00-.314-2.42L12.58 9.58a2 2 0 00-2.421-.314l-7.657 4.461A1 1 0 002.3 15.3l6.403 6.403a1 1 0 001.571-.204z" />
      <path d="M20 15v4" />
      <path d="M22 17h-4" />
      <path d="M4 4v4" />
      <path d="m5 18 2-2" />
      <path d="M6 6H2" />
      <path d="m7.699 10.7 5.602 5.601" />
    </svg>
  );
}

export default BroomSparkles;
