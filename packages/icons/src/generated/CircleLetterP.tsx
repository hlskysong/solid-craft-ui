import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface CircleLetterPProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: circle-letter-p）。 lucide 别名：parking-circle / circle-parking。 */
export function CircleLetterP(props: CircleLetterPProps) {
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
      <path d="M9 12h4a2 2 0 0 0 0-4H9.5a.5.5 0 0 0-.5.5V16" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export default CircleLetterP;
