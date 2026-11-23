import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface HelicopterProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: helicopter）。 */
export function Helicopter(props: HelicopterProps) {
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
      <path d="M11 17v4" />
      <path d="M14 3v8a2 2 0 0 0 2 2h5.865" />
      <path d="M17 17v4" />
      <path d="M18 17a4 4 0 0 0 4-4 8 6 0 0 0-8-6 6 5 0 0 0-6 5v3a2 2 0 0 0 2 2z" />
      <path d="M2 10v5" />
      <path d="M6 3h16" />
      <path d="M7 21h14" />
      <path d="M8 13H2" />
    </svg>
  );
}

export default Helicopter;
