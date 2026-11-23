import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ForkliftProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: forklift）。 */
export function Forklift(props: ForkliftProps) {
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
      <path d="M12 12H5a2 2 0 0 0-2 2v5" />
      <path d="M15 19h7" />
      <path d="M16 19V2" />
      <path d="M6 12V7a2 2 0 0 1 2-2h2.172a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 16 10.828" />
      <path d="M7 19h4" />
      <circle cx="13" cy="19" r="2" />
      <circle cx="5" cy="19" r="2" />
    </svg>
  );
}

export default Forklift;
