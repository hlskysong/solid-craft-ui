import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface VeganProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: vegan）。 */
export function Vegan(props: VeganProps) {
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
      <path d="M16 8q6 0 6-6-6 0-6 6" />
      <path d="M17.41 3.59a10 10 0 1 0 3 3" />
      <path d="M2 2a26.6 26.6 0 0 1 10 20c.9-6.82 1.5-9.5 4-14" />
    </svg>
  );
}

export default Vegan;
