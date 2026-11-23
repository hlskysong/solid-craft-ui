import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface GlobeBanProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: globe-ban）。 */
export function GlobeBan(props: GlobeBanProps) {
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
      <path d="M12 22a14.48 14.48 0 01-4.008-10C7.993 9.136 9 5.258 11 2.05A10 10 0 0012 22" />
      <path d="m15.172 3.172 5.656 5.656" />
      <path d="M15.86 14a14.5 14.5 0 01-3.859 8 10 10 0 009.949-9" />
      <path d="M2 12h10.5" />
      <circle cx="18" cy="6" r="4" />
    </svg>
  );
}

export default GlobeBan;
