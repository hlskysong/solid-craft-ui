import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface GapVerticalProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: gap-vertical）。 */
export function GapVertical(props: GapVerticalProps) {
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
      <path d="M2 12h2" />
      <path d="M8 12h2" />
      <path d="M14 12h2" />
      <path d="M20 12h2" />
      <path d="M3 21v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
      <path d="M3 3v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3" />
    </svg>
  );
}

export default GapVertical;
