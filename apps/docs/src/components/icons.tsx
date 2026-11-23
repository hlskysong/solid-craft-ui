import type { JSX } from 'solid-js';

/**
 * 文档站 chrome 专用内联图标（lucide 风格路径）。
 * 不引入 solid-craft-icons：chrome 图标与组件库图标包解耦，也避免给 apps/docs 新增依赖。
 * 全部 aria-hidden，语义由宿主按钮 / 链接的 aria-label 或可见文本承担。
 */
function IconBase(props: { class?: string; filled?: boolean; children?: JSX.Element }) {
  return (
    <svg
      class={props.class ?? 'docs-icon'}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill={props.filled ? 'currentColor' : 'none'}
      stroke={props.filled ? 'none' : 'currentColor'}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}

export function SearchIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </IconBase>
  );
}

export function MenuIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </IconBase>
  );
}

export function CloseIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </IconBase>
  );
}

export function InfoIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </IconBase>
  );
}

export function ChevronIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <polyline points="6 9 12 15 18 9" />
    </IconBase>
  );
}

export function CodeIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </IconBase>
  );
}

export function CopyIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </IconBase>
  );
}

export function ExternalIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </IconBase>
  );
}

export function FileTextIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </IconBase>
  );
}

export function DropletIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </IconBase>
  );
}

export function LayersIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </IconBase>
  );
}

/** GitHub mark（fill 路径，非描边）。 */
export function GitHubIcon(props: { class?: string }) {
  return (
    <IconBase class={props.class} filled>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </IconBase>
  );
}
