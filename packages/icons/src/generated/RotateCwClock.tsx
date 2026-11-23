import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface RotateCwClockProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: rotate-cw-clock）。 */
export function RotateCwClock(props: RotateCwClockProps) {
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
      <path d="M12 7v5l4 2" />
      <path d="M16 8h5V3" />
      <path d="m21 8-2.3-2.3A9.7 9.7 0 0012 3a9 9 0 109 9" />
    </svg>
  );
}

export default RotateCwClock;
