import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface RockingChairProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: rocking-chair）。 */
export function RockingChair(props: RockingChairProps) {
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
      <path d="m15 13 3.708 7.416" />
      <path d="M3 19a15 15 0 0 0 18 0" />
      <path d="m3 2 3.21 9.633A2 2 0 0 0 8.109 13H18" />
      <path d="m9 13-3.708 7.416" />
    </svg>
  );
}

export default RockingChair;
