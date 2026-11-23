import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface DatabaseMinusProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: database-minus）。 */
export function DatabaseMinus(props: DatabaseMinusProps) {
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
      <path d="M21 15V5" />
      <path d="M22 19h-6" />
      <path d="M3 12A9 3 0 0 0 21 12" />
      <path d="M3 5V19A9 3 0 0 0 13.318 21.968" />
      <ellipse cx="12" cy="5" rx="9" ry="3" />
    </svg>
  );
}

export default DatabaseMinus;
