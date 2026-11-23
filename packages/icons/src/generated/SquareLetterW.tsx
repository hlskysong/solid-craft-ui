import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface SquareLetterWProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: square-letter-w）。 */
export function SquareLetterW(props: SquareLetterWProps) {
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
      <path d="m16 8-1.591 7.598a.497.497 0 01-.97.038l-.96-3.276a.5.5 0 00-.959 0l-.96 3.276a.496.496 0 01-.969-.038L8 8" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

export default SquareLetterW;
