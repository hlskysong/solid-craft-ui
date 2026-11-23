import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface PerfumeBottleProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: perfume-bottle）。 */
export function PerfumeBottle(props: PerfumeBottleProps) {
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
      <path d="M 5 22 H 11.072" />
      <path d="M15 5 C 23 4 23.328 12.676 20 14.536" />
      <path d="M15.802 10.308 C 14.776 9.465 14 8.496 14 7" />
      <path d="M2 2h.01" />
      <path d="M2 7h.01" />
      <path d="M5 4.5h.01" />
      <path d="M8.127 22 A 8 8 0 0 1 4 15 3 3 0 0 1 4.879 12.879C 6.879 10.879 10 10 10 7" />
      <circle cx="18" cy="18" r="4" />
      <rect x="9" y="2" width="6" height="5" rx="1" />
    </svg>
  );
}

export default PerfumeBottle;
