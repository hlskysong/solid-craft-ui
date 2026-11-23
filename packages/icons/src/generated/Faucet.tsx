import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface FaucetProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: faucet）。 */
export function Faucet(props: FaucetProps) {
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
      <path d="M10.083 5.428 5.57 4.083a2 2 0 10.001 3.834l4.512-1.345" />
      <path d="M12 8v3" />
      <path d="m13.917 5.428 4.511-1.345a2 2 0 110 3.834l-4.51-1.345" />
      <path d="M18 17v-4.006" />
      <path d="M22 11v8" />
      <path d="M22 12h-3a1 1 0 00-1 .994h-2.539a4 4 0 00-6.915-.012L7 13a5 5 0 00-5 5v1a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 01.995-1l1.552.018a4 4 0 006.907 0L18 17a1 1 0 001 1h3" />
      <circle cx="12" cy="6" r="2" />
    </svg>
  );
}

export default Faucet;
