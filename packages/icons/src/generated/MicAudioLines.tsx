import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface MicAudioLinesProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: mic-audio-lines）。 */
export function MicAudioLines(props: MicAudioLinesProps) {
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
      <path d="M10 3v2.341" />
      <path d="M12 17v4" />
      <path d="M14 5v.341" />
      <path d="M18 5v13" />
      <path d="M2 10v3" />
      <path d="M22 10v3" />
      <path d="M6 6v11" />
      <path d="M9 21h6" />
      <rect width="4" height="8" x="10" y="9" rx="2" />
    </svg>
  );
}

export default MicAudioLines;
