import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface SquircleDashedProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: squircle-dashed）。 */
export function SquircleDashed(props: SquircleDashedProps) {
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
      <path d="M13.77 3.043a34 34 0 0 0-3.54 0" />
      <path d="M13.771 20.956a33 33 0 0 1-3.541.001" />
      <path d="M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44" />
      <path d="M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438" />
      <path d="M20.957 10.23a33 33 0 0 1 0 3.54" />
      <path d="M3.043 10.23a34 34 0 0 0 .001 3.541" />
      <path d="M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438" />
      <path d="M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44" />
    </svg>
  );
}

export default SquircleDashed;
