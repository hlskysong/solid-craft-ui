import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface Navigation2OffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: navigation-2-off）。 */
export function Navigation2Off(props: Navigation2OffProps) {
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
      <path d="M9.31 9.31 5 21l7-4 7 4-1.17-3.17" />
      <path d="M14.53 8.88 12 2l-1.17 3.17" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export default Navigation2Off;
