import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface BrainCircuitProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: brain-circuit）。 */
export function BrainCircuit(props: BrainCircuitProps) {
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
      <path d="M12 13h4" />
      <path d="M12 18h6a2 2 0 012 2v1" />
      <path d="M12 8h8" />
      <path d="M12 9a4.17 4.17 0 01-3 4" />
      <path d="M16 8V5a2 2 0 012-2" />
      <path d="M6 18a4 4 0 01-2-7.465" />
      <path d="M6.004 5.125a4 4 0 00-2.526 5.77" />
      <path d="M6.294 6.294A3 3 0 1112 5v13a4 4 0 11-7.967-.518" />
      <circle cx="16" cy="13" r="0.5" fill="currentColor" />
      <circle cx="18" cy="3" r="0.5" fill="currentColor" />
      <circle cx="20" cy="21" r="0.5" fill="currentColor" />
      <circle cx="20" cy="8" r="0.5" fill="currentColor" />
    </svg>
  );
}

export default BrainCircuit;
