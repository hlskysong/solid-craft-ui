import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface SignpostBigProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: signpost-big）。 */
export function SignpostBig(props: SignpostBigProps) {
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
      <path d="M10 9H4L2 7l2-2h6" />
      <path d="M14 5h6l2 2-2 2h-6" />
      <path d="M10 22V4a2 2 0 1 1 4 0v18" />
      <path d="M8 22h8" />
    </svg>
  );
}

export default SignpostBig;
