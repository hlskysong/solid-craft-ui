import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface HotAirBalloonProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: hot-air-balloon）。 */
export function HotAirBalloon(props: HotAirBalloonProps) {
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
      <path d="M11.5 18C10 15 9 12 9 9a3 7 0 0 1 6 0c0 3-1 6-2.5 9" />
      <path d="M15 18c3-3 5-5 5-9A8 7 0 0 0 4 9c0 4 2 6 5 9" />
      <path d="M15 18H9v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1z" />
    </svg>
  );
}

export default HotAirBalloon;
