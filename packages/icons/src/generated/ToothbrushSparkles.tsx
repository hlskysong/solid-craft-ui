import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ToothbrushSparklesProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: toothbrush-sparkles）。 */
export function ToothbrushSparkles(props: ToothbrushSparklesProps) {
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
      <path d="M10 3H8" />
      <path d="M14.586 11.414 22 4" />
      <path d="M15 11a8 8 0 01-.429.4" />
      <path d="m2 22 7-7c1.857-1.857 3.714-1.99 5.571-3.6l-1.985-1.986A2 2 0 0114 6a2 2 0 012-2 2 2 0 013.262-1.552l2.152 2.138" />
      <path d="M20 15v4" />
      <path d="M22 17h-4" />
      <path d="M4 5v4" />
      <path d="M6 7H2" />
      <path d="M9 2v2" />
    </svg>
  );
}

export default ToothbrushSparkles;
