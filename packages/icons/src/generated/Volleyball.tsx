import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface VolleyballProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: volleyball）。 */
export function Volleyball(props: VolleyballProps) {
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
      <path d="M11 7a16 16 20 0 1 10.98 4.362" />
      <path d="M12 12a13 13 0 0 1-8.66 5" />
      <path d="M16.83 13.634a16 16 0 0 1-9.267 7.328" />
      <path d="M20.66 17A13 13 0 0 0 12 12a13 13 0 0 1 0-10" />
      <path d="M8.17 15.366a16 16 0 0 1-1.713-11.69" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export default Volleyball;
