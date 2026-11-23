import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface MouseLeftProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: mouse-left）。 */
export function MouseLeft(props: MouseLeftProps) {
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
      <path d="M12 7.318V10" />
      <path d="M5 10v5a7 7 0 0 0 14 0V9c0-3.527-2.608-6.515-6-7" />
      <circle cx="7" cy="4" r="2" />
    </svg>
  );
}

export default MouseLeft;
