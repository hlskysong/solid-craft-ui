import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface FileDatabaseProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: file-database）。 */
export function FileDatabase(props: FileDatabaseProps) {
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
      <path d="M12 12v8a5 2 0 01-10 0v-8" />
      <path d="M12 16a5 2 0 01-10 0" />
      <path d="M14 2v5a1 1 0 001 1h5" />
      <path d="M4 6.3V4a2 2 0 012-2h8a2.4 2.4 0 011.706.706l3.588 3.588A2.4 2.4 0 0120 8v12a2 2 0 01-2 2h-2.43" />
      <ellipse cx="7" cy="12" rx="5" ry="2" />
    </svg>
  );
}

export default FileDatabase;
