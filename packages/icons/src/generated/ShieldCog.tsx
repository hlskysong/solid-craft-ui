import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ShieldCogProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: shield-cog）。 */
export function ShieldCog(props: ShieldCogProps) {
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
      <path d="m10.929 14.467-.383.924" />
      <path d="M10.929 8.923 10.546 8" />
      <path d="M13.225 8.923 13.608 8" />
      <path d="m13.607 15.391-.382-.924" />
      <path d="m14.849 10.547.923-.383" />
      <path d="m14.849 12.843.923.383" />
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9.305 10.547-.923-.383" />
      <path d="m9.305 12.843-.923.383" />
      <circle cx="12.077" cy="11.695" r="3" />
    </svg>
  );
}

export default ShieldCog;
