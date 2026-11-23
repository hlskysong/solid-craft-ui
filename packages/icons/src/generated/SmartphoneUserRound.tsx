import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface SmartphoneUserRoundProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: smartphone-user-round）。 */
export function SmartphoneUserRound(props: SmartphoneUserRoundProps) {
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
      <path d="M10 22H6a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2v4" />
      <path d="M11 18h.01" />
      <path d="M22 22a4 4 0 00-8 0" />
      <circle cx="18" cy="15" r="3" />
    </svg>
  );
}

export default SmartphoneUserRound;
