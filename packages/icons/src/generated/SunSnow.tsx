import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface SunSnowProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: sun-snow）。 */
export function SunSnow(props: SunSnowProps) {
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
      <path d="M10 21v-1" />
      <path d="M10 4V3" />
      <path d="M10 9a3 3 0 0 0 0 6" />
      <path d="m14 20 1.25-2.5L18 18" />
      <path d="m14 4 1.25 2.5L18 6" />
      <path d="m17 21-3-6 1.5-3H22" />
      <path d="m17 3-3 6 1.5 3" />
      <path d="M2 12h1" />
      <path d="m20 10-1.5 2 1.5 2" />
      <path d="m3.64 18.36.7-.7" />
      <path d="m4.34 6.34-.7-.7" />
    </svg>
  );
}

export default SunSnow;
