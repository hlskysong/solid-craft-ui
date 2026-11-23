import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface Printer3dProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: printer-3d）。 */
export function Printer3d(props: Printer3dProps) {
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
      <path d="M10 11v1" />
      <path d="M12 8h8" />
      <path d="M15 20v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3" />
      <path d="M4 20h16" />
      <path d="M4 22V4a2 2 0 012-2h12a2 2 0 012 2v18" />
      <path d="M4 8h4" />
      <path d="M8.635 10.093A2 2 0 018 8.631V7a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-.293.707l-1 1a1 1 0 01-1.414 0z" />
    </svg>
  );
}

export default Printer3d;
