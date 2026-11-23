import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface DoorStairwellProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: door-stairwell）。 */
export function DoorStairwell(props: DoorStairwellProps) {
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
      <path d="M12 17v-3a1 1 0 011-1h6" />
      <path d="M19 17h-9a1 1 0 00-1 1v3" />
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
      <path d="M19 9h-3a1 1 0 00-1 1v3" />
      <path d="M22 21H2" />
    </svg>
  );
}

export default DoorStairwell;
