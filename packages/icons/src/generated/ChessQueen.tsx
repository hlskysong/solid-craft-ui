import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ChessQueenProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: chess-queen）。 */
export function ChessQueen(props: ChessQueenProps) {
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
      <path d="m10.68 5.499-.996 4.982a.65.65 0 01-1.131.295L5.885 7.663" />
      <path d="m13.32 5.5.995 4.98a.65.65 0 001.131.296l2.668-3.113" />
      <path d="M20.428 8.952 17.5 18" />
      <path d="M4 20a2 2 0 012-2h12a2 2 0 012 2v1a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
      <path d="M6.5 18 3.571 8.952" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="20" cy="7" r="2" />
      <circle cx="4" cy="7" r="2" />
    </svg>
  );
}

export default ChessQueen;
