import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface LighthouseProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: lighthouse）。 */
export function Lighthouse(props: LighthouseProps) {
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
      <path d="M12 3V2" />
      <path d="M16.066 16.865 7 22l2-11V6a3 3 0 016 0v5l2 11" />
      <path d="m19.792 4.5.866-.5" />
      <path d="m19.797 13.5.866.5" />
      <path d="M21 9h1" />
      <path d="M3 9H2" />
      <path d="m4.203 13.5-.866.5" />
      <path d="M4.208 4.5 3.342 4" />
      <path d="M5.5 22h13" />
      <path d="m7.932 16.875 7.377-4.178" />
      <path d="M8 11h8" />
      <path d="M8 7h8" />
    </svg>
  );
}

export default Lighthouse;
