import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface MemoryStickProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: memory-stick）。 */
export function MemoryStick(props: MemoryStickProps) {
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
      <path d="M12 12v-2" />
      <path d="M12 18v-2" />
      <path d="M16 12v-2" />
      <path d="M16 18v-2" />
      <path d="M2 11h1.5" />
      <path d="M20 18v-2" />
      <path d="M20.5 11H22" />
      <path d="M4 18v-2" />
      <path d="M8 12v-2" />
      <path d="M8 18v-2" />
      <rect x="2" y="6" width="20" height="10" rx="2" />
    </svg>
  );
}

export default MemoryStick;
