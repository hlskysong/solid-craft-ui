import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface VirusOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: virus-off）。 */
export function VirusOff(props: VirusOffProps) {
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
      <path d="M10.01 10h.01" />
      <path d="M12 14.991h.01" />
      <path d="M12 22v-3" />
      <path d="M12 2v3" />
      <path d="M13 22h-2" />
      <path d="M13 2h-2" />
      <path d="m16.5 19.794-1-1.733" />
      <path d="m16.5 4.205-1 1.732" />
      <path d="M18.891 13.235a7 7 0 00-8.126-8.126" />
      <path d="m19.794 7.5-1.732 1" />
      <path d="M2 12h3" />
      <path d="M2 13v-2" />
      <path d="m2 2 20 20" />
      <path d="M22 12h-3" />
      <path d="M22 13v-2" />
      <path d="m4.206 16.5 1.732-1" />
      <path d="m4.206 7.5 1.732 1" />
      <path d="M7.05 7.05a7 7 0 009.9 9.9" />
      <path d="m7.5 19.794 1-1.733" />
      <path d="M9 12h.01" />
    </svg>
  );
}

export default VirusOff;
