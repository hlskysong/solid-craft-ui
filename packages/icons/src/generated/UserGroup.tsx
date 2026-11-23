import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface UserGroupProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: user-group）。 */
export function UserGroup(props: UserGroupProps) {
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
      <path d="M17 21v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1" />
      <path d="M19 10h1a2 2 0 012 2v1" />
      <path d="M5 10H4a2 2 0 00-2 2v1" />
      <circle cx="12" cy="11" r="3" />
      <circle cx="18" cy="4" r="2" />
      <circle cx="6" cy="4" r="2" />
    </svg>
  );
}

export default UserGroup;
