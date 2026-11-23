import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface DiagramFlowVerticalProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: diagram-flow-vertical）。 */
export function DiagramFlowVertical(props: DiagramFlowVerticalProps) {
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
      <path d="M12 8.5a3.5 3.5 0 003.5 3.5 3.5 3.5 0 013.5 3.5v.5" />
      <path d="M12 8v.5A3.5 3.5 0 018.5 12 3.5 3.5 0 005 15.5v.5" />
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
    </svg>
  );
}

export default DiagramFlowVertical;
