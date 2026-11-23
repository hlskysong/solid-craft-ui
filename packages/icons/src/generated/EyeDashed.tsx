import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface EyeDashedProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: eye-dashed）。 */
export function EyeDashed(props: EyeDashedProps) {
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
      <path d="M13.054 18.946a11 11 0 0 1-2.11 0" />
      <path d="M13.054 5.054a11 11 0 0 0-2.11-.001" />
      <path d="M17.072 6.274a11 11 0 0 1 1.753 1.173" />
      <path d="M18.825 16.552a11 11 0 0 1-1.753 1.174" />
      <path d="M2.514 13.303a11 11 0 0 1-.452-.954 1 1 0 0 1 0-.697 11 11 0 0 1 .45-.955" />
      <path d="M21.485 10.697a11 11 0 0 1 .453.955 1 1 0 0 1 0 .697 11 11 0 0 1-.453.954" />
      <path d="M5.173 7.448a11 11 0 0 1 1.753-1.174" />
      <path d="M6.926 17.726a11 11 0 0 1-1.753-1.174" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default EyeDashed;
