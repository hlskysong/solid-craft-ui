import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ZodiacCancerProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: zodiac-cancer）。 */
export function ZodiacCancer(props: ZodiacCancerProps) {
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
      <path d="M21 14.5A9 6.5 0 0 1 5.5 19" />
      <path d="M3 9.5A9 6.5 0 0 1 18.5 5" />
      <circle cx="17.5" cy="14.5" r="3.5" />
      <circle cx="6.5" cy="9.5" r="3.5" />
    </svg>
  );
}

export default ZodiacCancer;
