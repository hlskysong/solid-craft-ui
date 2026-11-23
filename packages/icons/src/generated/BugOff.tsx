import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface BugOffProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: bug-off）。 */
export function BugOff(props: BugOffProps) {
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
      <path d="M12 20v-8" />
      <path d="M12.656 7H14a4 4 0 0 1 4 4v1.344" />
      <path d="M14.12 3.88 16 2" />
      <path d="M17.123 17.123A6 6 0 0 1 6 14v-3a4 4 0 0 1 1.72-3.287" />
      <path d="m2 2 20 20" />
      <path d="M21 5a4 4 0 0 1-3.55 3.97" />
      <path d="M22 13h-3.344" />
      <path d="M3 21a4 4 0 0 1 3.81-4" />
      <path d="M3 5a4 4 0 0 0 3.55 3.97" />
      <path d="M6 13H2" />
      <path d="m8 2 1.88 1.88" />
      <path d="M9.712 4.06A3 3 0 0 1 15 6v1.13" />
    </svg>
  );
}

export default BugOff;
