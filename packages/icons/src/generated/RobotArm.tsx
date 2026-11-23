import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface RobotArmProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: robot-arm）。 */
export function RobotArm(props: RobotArmProps) {
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
      <path d="M12 21 7.5 8.322" />
      <path d="m14 7 1.75-3.767a.5.5 0 0 1 .662-.172L20 5.005" />
      <path d="m20 8.998-3.588 1.944a.5.5 0 0 1-.662-.172L14 7H8" />
      <path d="M3.486 21h10" />
      <path d="M5 21V8.732" />
      <circle cx="6" cy="7" r="2" />
    </svg>
  );
}

export default RobotArm;
