/**
 * 文字提示（T3-09）。
 *
 * 分层：`primitives/anchored` 的 `PrimitiveTooltip` 是唯一浮层接缝，hover / focus
 * 时序、翻转定位、箭头、ESC 与焦点归还全部由 Kobalte 原语实现。本文件只做三件事：
 * 受控优先级、方向 / 延迟 / 箭头归一、视觉属性包。**不出现任何 Portal、
 * `document.activeElement`、ESC 或 focus 钩子** —— 那是 §4.2 与锚点禁止的
 * 「第二套焦点与 ESC 语义」。
 *
 * 状态单点：`open > defaultOpen > 内部信号`。传给原语的永远是受控值，
 * 与 Select / Modal / Drawer 同口径；非受控时把原语的变更请求回写到内部信号。
 *
 * `data-scui-anchor` 恒输出（默认 `top`）：服务端只出触发按钮静态骨架，
 * 客户端浮层挂载后属性仍与方向真源一致，避免 SSR / 客户端两套选择器。
 */
import { createSignal, splitProps, type JSX } from 'solid-js';

import { PrimitiveTooltip, type PrimitiveAnchoredAttributes } from '../../primitives';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { TooltipPlacement, TooltipProps } from './types';

const TOOLTIP_PROPS = [
  'content',
  'children',
  'placement',
  'openDelay',
  'closeDelay',
  'arrow',
  'disabled',
  'open',
  'defaultOpen',
  'onOpenChange',
  'class',
] as const;

export function Tooltip(props: TooltipProps): JSX.Element {
  const [local] = splitProps(props, TOOLTIP_PROPS);

  const [internalOpen, setInternalOpen] = createSignal(local.defaultOpen === true);

  const isOpen = () => local.open ?? internalOpen();
  const placement = (): TooltipPlacement => local.placement ?? 'top';

  const handleOpenChange = (next: boolean): void => {
    if (local.open === undefined) setInternalOpen(next);
    local.onOpenChange?.(next);
  };

  const triggerAttributes = (): PrimitiveAnchoredAttributes => ({
    class: classNames(`${CSS_PREFIX}tooltip__trigger`, local.class),
    'data-scui-role': 'tooltip-trigger',
  });

  const contentAttributes = (): PrimitiveAnchoredAttributes => ({
    class: `${CSS_PREFIX}tooltip`,
    'data-scui-role': 'tooltip',
    'data-scui-anchor': placement(),
  });

  return (
    <PrimitiveTooltip
      open={isOpen()}
      onOpenChange={handleOpenChange}
      placement={placement()}
      openDelay={local.openDelay ?? 200}
      closeDelay={local.closeDelay ?? 100}
      arrow={local.arrow !== false}
      disabled={local.disabled}
      trigger={local.children}
      triggerAttributes={triggerAttributes()}
      contentAttributes={contentAttributes()}
      arrowAttributes={{
        class: `${CSS_PREFIX}tooltip__arrow`,
        'data-scui-role': 'tooltip-arrow',
      }}
    >
      {local.content}
    </PrimitiveTooltip>
  );
}
