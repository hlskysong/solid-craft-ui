/**
 * 抽屉（T3-08）。
 *
 * 分层：`primitives/overlay` 是**唯一**浮层接缝（Portal / 遮罩 / 焦点陷阱 /
 * ESC / 焦点归还），本文件只做三件事：受控开关状态机、方向与尺寸归一、视觉属性包。
 * §4.2 T3-08 验收原话「与 Modal 共用焦点管理与浮层原语，不重复实现」即指这里
 * 不出现任何 Portal / `document.activeElement` / focus scope / ESC 钩子代码。
 *
 * 状态单点：`open > defaultOpen > 内部信号`，与 Select / Table / Pagination / Modal
 * 同一受控口径。无论受控与否，传给原语的永远是受控值 —— Kobalte 的
 * `onOpenChange(false)` 只是一次「关闭请求」，上层可据此裁决。
 *
 * 方向归一：`left / right` 用 `width`，`top / bottom` 用 `height`，两者都写进同一个
 * `--scui-drawer-size` 自定义属性。这样 SCSS 只需一套贴边规则，不会出现
 * 「top 方向传了 width 却撑开高度」的错配；内联自定义属性优先级高于三档 size。
 *
 * SSR：弹层只在 `useClientReady()` 为真（客户端 onMount 后）挂载，服务端
 * 输出为空，由调用方自己的触发按钮承担静态骨架。
 */
import { createSignal, splitProps, type JSX } from 'solid-js';

import { PrimitiveOverlay, type PrimitiveOverlayAttributes } from '../../primitives';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { DrawerPlacement, DrawerProps } from './types';

const DRAWER_PROPS = [
  'open',
  'defaultOpen',
  'onOpenChange',
  'title',
  'children',
  'footer',
  'placement',
  'size',
  'width',
  'height',
  'closable',
  'keyboard',
  'maskClosable',
  'closeLabel',
  'class',
] as const;

/** 上下方向走 block（高度），左右方向走 inline（宽度）。 */
const isVerticalSide = (side: DrawerPlacement): boolean => side === 'top' || side === 'bottom';

const toCssSize = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : value;

export function Drawer(props: DrawerProps): JSX.Element {
  const [local] = splitProps(props, DRAWER_PROPS);

  const [internalOpen, setInternalOpen] = createSignal(local.defaultOpen === true);

  const isOpen = () => local.open ?? internalOpen();
  const side = () => local.placement ?? 'right';
  const size = () => local.size ?? 'medium';

  /** 统一关闭出口；受控时只发事件，不改内部信号（DOM 由调用方回弹）。 */
  const handleOpenChange = (next: boolean): void => {
    if (next) return;
    if (local.open === undefined) setInternalOpen(false);
    local.onOpenChange?.(false);
  };

  /** 显式尺寸只取当前方向对应的那一个，另一个方向传了也不生效。 */
  const contentStyle = (): string | undefined => {
    const explicit = isVerticalSide(side()) ? local.height : local.width;
    if (explicit === undefined) return undefined;
    return `--scui-drawer-size: ${toCssSize(explicit)};`;
  };

  const contentAttributes = (): PrimitiveOverlayAttributes => ({
    class: classNames(`${CSS_PREFIX}drawer`, local.class),
    style: contentStyle(),
    'data-scui-role': 'drawer',
    'data-scui-side': side(),
    'data-scui-size': size(),
  });

  return (
    <PrimitiveOverlay
      open={isOpen()}
      onOpenChange={handleOpenChange}
      title={local.title}
      footer={local.footer}
      closeLabel={local.closeLabel ?? '关闭'}
      closable={local.closable !== false}
      keyboard={local.keyboard !== false}
      maskClosable={local.maskClosable !== false}
      overlayAttributes={{
        class: `${CSS_PREFIX}drawer__overlay`,
        'data-scui-role': 'drawer-overlay',
      }}
      contentAttributes={contentAttributes()}
      titleAttributes={{
        class: `${CSS_PREFIX}drawer__title`,
        'data-scui-role': 'drawer-title',
      }}
      bodyAttributes={{
        class: `${CSS_PREFIX}drawer__body`,
        'data-scui-role': 'drawer-body',
      }}
      footerAttributes={{
        class: `${CSS_PREFIX}drawer__footer`,
        'data-scui-role': 'drawer-footer',
      }}
      closeAttributes={{
        class: `${CSS_PREFIX}drawer__close`,
        'data-scui-role': 'drawer-close',
      }}
    >
      {local.children}
    </PrimitiveOverlay>
  );
}
