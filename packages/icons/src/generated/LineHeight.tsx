import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface LineHeightProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: line-height）。 */
export function LineHeight(props: LineHeightProps) {
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
      <path d="M15 14H9" />
      <path d="M21 21H3" />
      <path d="M21 3H3" />
      <path d="m8 16 3.453-7.648a.6.6 0 011.094.001L16 16" />
    </svg>
  );
}

export default LineHeight;
