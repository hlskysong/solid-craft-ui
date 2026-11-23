import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface CircleLetterPOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: circle-letter-p-off）。 lucide 别名：parking-circle-off / circle-parking-off。 */
export function CircleLetterPOff(props: CircleLetterPOffProps) {
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
      <path d="M12 12h1a2 2 0 000-4H9.5a.5.5 0 00-.5.5V9" />
      <path d="M15.652 21.31A10 10 0 012.691 8.348" />
      <path d="M22 22 2 2" />
      <path d="M4.929 4.929a10 10 0 0116.729 4.483 10 10 0 01-2.588 9.658" />
      <path d="M9 14.657V16" />
    </svg>
  );
}

export default CircleLetterPOff;
