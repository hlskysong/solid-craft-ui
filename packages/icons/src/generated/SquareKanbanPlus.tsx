import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface SquareKanbanPlusProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: square-kanban-plus）。 */
export function SquareKanbanPlus(props: SquareKanbanPlusProps) {
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
      <path d="M12 7v4" />
      <path d="M12.354 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v7.354" />
      <path d="M15 18h6" />
      <path d="M16 7v4.536" />
      <path d="M18 21v-6" />
      <path d="M8 7v7" />
    </svg>
  );
}

export default SquareKanbanPlus;
