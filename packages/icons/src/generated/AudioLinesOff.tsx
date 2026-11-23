import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface AudioLinesOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: audio-lines-off）。 */
export function AudioLinesOff(props: AudioLinesOffProps) {
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
      <path d="M10 10v11" />
      <path d="M10 3v1.35" />
      <path d="M14 14v1" />
      <path d="M14 8v.35" />
      <path d="M18 5v7.35" />
      <path d="M2 10v3" />
      <path d="m2 2 20 20" />
      <path d="M22 10v3" />
      <path d="M6 6v11" />
    </svg>
  );
}

export default AudioLinesOff;
