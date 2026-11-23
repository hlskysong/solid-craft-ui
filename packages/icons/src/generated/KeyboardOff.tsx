import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface KeyboardOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: keyboard-off）。 */
export function KeyboardOff(props: KeyboardOffProps) {
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
      <path d="M 20 4 A2 2 0 0 1 22 6" />
      <path d="M 22 6 L 22 16.41" />
      <path d="M 7 16 L 16 16" />
      <path d="M 9.69 4 L 20 4" />
      <path d="M14 8h.01" />
      <path d="M18 8h.01" />
      <path d="m2 2 20 20" />
      <path d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />
      <path d="M6 8h.01" />
      <path d="M8 12h.01" />
    </svg>
  );
}

export default KeyboardOff;
