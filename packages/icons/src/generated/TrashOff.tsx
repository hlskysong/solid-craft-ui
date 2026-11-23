import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface TrashOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: trash-off）。 */
export function TrashOff(props: TrashOffProps) {
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
      <path d="M10 11v6" />
      <path d="M14 17v-3" />
      <path d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-1.576.768" />
      <path d="M19 6v7.344" />
      <path d="m2 2 20 20" />
      <path d="M21 6h-9.344" />
      <path d="M3 6h3" />
      <path d="M5 6v14a2 2 0 002 2h10a2 2 0 002-2v-1" />
    </svg>
  );
}

export default TrashOff;
