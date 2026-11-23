import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface CaptionsOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: captions-off）。 */
export function CaptionsOff(props: CaptionsOffProps) {
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
      <path d="M10.5 5H19a2 2 0 0 1 2 2v8.5" />
      <path d="M17 11h-.5" />
      <path d="M19 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2" />
      <path d="m2 2 20 20" />
      <path d="M7 11h4" />
      <path d="M7 15h2.5" />
    </svg>
  );
}

export default CaptionsOff;
