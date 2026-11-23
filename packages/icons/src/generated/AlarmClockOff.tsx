import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface AlarmClockOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: alarm-clock-off）。 */
export function AlarmClockOff(props: AlarmClockOffProps) {
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
      <path d="M6.87 6.87a8 8 0 1 0 11.26 11.26" />
      <path d="M19.9 14.25a8 8 0 0 0-9.15-9.15" />
      <path d="m22 6-3-3" />
      <path d="M6.26 18.67 4 21" />
      <path d="m2 2 20 20" />
      <path d="M4 4 2 6" />
    </svg>
  );
}

export default AlarmClockOff;
