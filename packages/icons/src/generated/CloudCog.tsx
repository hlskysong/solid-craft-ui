import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface CloudCogProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: cloud-cog）。 */
export function CloudCog(props: CloudCogProps) {
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
      <path d="m10.852 19.772-.383.924" />
      <path d="m13.148 14.228.383-.923" />
      <path d="M13.148 19.772a3 3 0 1 0-2.296-5.544l-.383-.923" />
      <path d="m13.53 20.696-.382-.924a3 3 0 1 1-2.296-5.544" />
      <path d="m14.772 15.852.923-.383" />
      <path d="m14.772 18.148.923.383" />
      <path d="M4.2 15.1a7 7 0 1 1 9.93-9.858A7 7 0 0 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.2" />
      <path d="m9.228 15.852-.923-.383" />
      <path d="m9.228 18.148-.923.383" />
    </svg>
  );
}

export default CloudCog;
