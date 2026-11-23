import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface BrainOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: brain-off）。 */
export function BrainOff(props: BrainOffProps) {
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
      <path d="M12 18v-6" />
      <path d="M12 5v1.344" />
      <path d="M17.707 6.293A3 3 0 1012 5a3 3 0 00-4.124-2.781" />
      <path d="M17.997 5.125a4 4 0 012.526 5.77" />
      <path d="M19.644 19.644A4 4 0 0112 18a4 4 0 11-7.967-.517" />
      <path d="m2 2 20 20" />
      <path d="M20 10.536a4 4 0 011.533 5.34" />
      <path d="M3.477 10.895a4 4 0 011.876-5.542" />
      <path d="M6 18a4 4 0 01-2-7.464" />
      <path d="M9 13a4.17 4.17 0 002.166-1.5 4 4 0 00.138-.196" />
    </svg>
  );
}

export default BrainOff;
