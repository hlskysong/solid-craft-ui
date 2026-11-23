import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ShieldCogCornerProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: shield-cog-corner）。 */
export function ShieldCogCorner(props: ShieldCogCornerProps) {
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
      <path d="M11 22c-3.806-1.45-7-3.966-7-9V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v4" />
      <path d="M14.923 16.547 14 16.164" />
      <path d="m14.923 18.843-.923.383" />
      <path d="M16.547 14.923 16.164 14" />
      <path d="m16.547 20.467-.383.924" />
      <path d="m18.843 14.923.383-.923" />
      <path d="m19.225 21.391-.382-.924" />
      <path d="m20.467 16.547.923-.383" />
      <path d="m20.467 18.843.923.383" />
      <circle cx="17.695" cy="17.695" r="3" />
    </svg>
  );
}

export default ShieldCogCorner;
