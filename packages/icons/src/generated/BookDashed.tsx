import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface BookDashedProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v1.69.0 全量生成（name: book-dashed）。 lucide 别名：book-template。 */
export function BookDashed(props: BookDashedProps) {
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
      <path d="M12 17h1.5" />
      <path d="M12 22h1.5" />
      <path d="M12 2h1.5" />
      <path d="M17.5 22H19a1 1 0 0 0 1-1" />
      <path d="M17.5 2H19a1 1 0 0 1 1 1v1.5" />
      <path d="M20 14v3h-2.5" />
      <path d="M20 8.5V10" />
      <path d="M4 10V8.5" />
      <path d="M4 19.5V14" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H8" />
      <path d="M8 22H6.5a1 1 0 0 1 0-5H8" />
    </svg>
  );
}

export default BookDashed;
