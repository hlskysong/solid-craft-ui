import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface WebcamOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: webcam-off）。 */
export function WebcamOff(props: WebcamOffProps) {
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
      <path d="M12 22v-4" />
      <path d="M12.754 7.096a3 3 0 0 1 2.15 2.15" />
      <path d="M12.863 12.873a3 3 0 0 1-3.736-3.735" />
      <path d="M16.566 16.57A8 8 0 0 1 5.43 5.433" />
      <path d="m2 2 20 20" />
      <path d="M7 22h10" />
      <path d="M8.478 2.817a8 8 0 0 1 10.705 10.705" />
    </svg>
  );
}

export default WebcamOff;
