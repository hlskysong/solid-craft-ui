import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface CalendarCogProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: calendar-cog）。 */
export function CalendarCog(props: CalendarCogProps) {
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
      <path d="m15.228 16.852-.923-.383" />
      <path d="m15.228 19.148-.923.383" />
      <path d="M16 2v3" />
      <path d="m16.47 14.305.382.923" />
      <path d="m16.852 20.772-.383.924" />
      <path d="m19.148 15.228.383-.923" />
      <path d="m19.53 21.696-.382-.924" />
      <path d="m20.773 16.852.924-.383" />
      <path d="m20.773 19.148.924.383" />
      <path d="M21 10.5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h5.5" />
      <path d="M3 9h18" />
      <path d="M8 2v3" />
      <circle cx="18" cy="18" r="3" />
    </svg>
  );
}

export default CalendarCog;
