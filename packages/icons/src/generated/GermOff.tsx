import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface GermOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: germ-off）。 */
export function GermOff(props: GermOffProps) {
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
      <path d="m11 2 .925 1.848" />
      <path d="M13 15h.01" />
      <path d="M13.424 7.768a2 2 0 112.808 2.808" />
      <path d="m16 21-1-2.472" />
      <path d="M16.988 16.988A12 12 0 019 20a5 5 0 01-2.759-9.171 8.8 8.8 0 002.307-2.28" />
      <path d="m19 2-1 1.804" />
      <path d="m2 19 2.746-1.373" />
      <path d="m2 2 20 20" />
      <path d="m22 16-2.474-2.13a12 12 0 001.376-3.786 6 6 0 00-10.313-5.151" />
      <path d="m22 5-1.804 1" />
      <path d="m3 10 2 2" />
      <path d="M9 16h.01" />
      <path d="M9 20v2" />
    </svg>
  );
}

export default GermOff;
