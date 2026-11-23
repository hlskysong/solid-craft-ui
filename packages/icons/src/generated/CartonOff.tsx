import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface CartonOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: carton-off）。 */
export function CartonOff(props: CartonOffProps) {
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
      <path d="M10 10H5v10a2 2 0 002 2h10a2 2 0 002-2v-1" />
      <path d="M13 22v-9" />
      <path d="M13.902 8.245 16 6h-4.343" />
      <path d="M19 13.343V10a2 2 0 00-.539-1.367L16 6V3a1 1 0 00-1-1H9a1 1 0 00-.857.486" />
      <path d="m2 2 20 20" />
      <path d="M7.034 7.034 5.539 8.633A2 2 0 005 10" />
    </svg>
  );
}

export default CartonOff;
