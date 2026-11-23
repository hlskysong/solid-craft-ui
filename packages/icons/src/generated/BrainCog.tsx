import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface BrainCogProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: brain-cog）。 */
export function BrainCog(props: BrainCogProps) {
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
      <path d="m10.852 14.772-.383.923" />
      <path d="m10.852 9.228-.383-.923" />
      <path d="m13.148 14.772.382.924" />
      <path d="m13.53 8.305-.382.923" />
      <path d="m14.772 10.852.923-.383" />
      <path d="m14.772 13.148.923.383" />
      <path d="M17.997 5.125a4 4 0 012.526 5.77" />
      <path d="M18 18a4 4 0 002-7.464" />
      <path d="M4.033 17.483A4 4 0 0011.46 20c.184-.31.896-.31 1.076 0a4 4 0 007.43-2.517" />
      <path d="M6 18a4 4 0 01-2-7.464" />
      <path d="M6.002 5.125a4 4 0 00-2.525 5.77" />
      <path d="M6.293 6.294a3 3 0 01-.287-1.098l-.004-.07a3 3 0 015.968-.543c.05.02.057.01.059 0a3 3 0 015.968.542l-.004.071a3 3 0 01-.287 1.098" />
      <path d="m9.228 10.852-.923-.383" />
      <path d="m9.228 13.148-.923.383" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default BrainCog;
