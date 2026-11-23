import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface UsersRoundCollaborationProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: users-round-collaboration）。 */
export function UsersRoundCollaboration(props: UsersRoundCollaborationProps) {
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
      <path d="M20.453 8.911a9 9 0 00-6.696-5.738" />
      <path d="M21 22a4 4 0 00-8 0" />
      <path d="M3 12a4 4 0 017.963-.543" />
      <path d="M3.889 15.9a9 9 0 005.247 4.632" />
      <circle cx="17" cy="15" r="3" />
      <circle cx="7" cy="5" r="3" />
    </svg>
  );
}

export default UsersRoundCollaboration;
