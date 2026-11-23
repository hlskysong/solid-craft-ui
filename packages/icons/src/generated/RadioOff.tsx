import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface RadioOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: radio-off）。 */
export function RadioOff(props: RadioOffProps) {
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
      <path d="M13.414 13.414a2 2 0 1 1-2.828-2.828" />
      <path d="M16.247 7.761a6 6 0 0 1 1.744 4.572" />
      <path d="M19.075 4.933a10 10 0 0 1 2.234 10.72" />
      <path d="m2 2 20 20" />
      <path d="M4.925 19.067a10 10 0 0 1 0-14.134" />
      <path d="M7.753 16.239a6 6 0 0 1 0-8.478" />
    </svg>
  );
}

export default RadioOff;
