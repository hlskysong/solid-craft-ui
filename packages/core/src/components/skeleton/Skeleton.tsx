/**
 * 骨架屏（T3-05）。
 *
 * 设计核心只有一条：**骨架的高度必须等于它要替代的内容**。
 * 所以每个形状的块高都引用被替代组件的 token，不写字面量：
 * - `text` 行块高 = `--scui-line-height-md`（22px）= 正文行高，三行骨架正好三行文本；
 * - `table` 行块高 = 行高 + 2 × 单元格 `padding-block`，与 Table 默认密度同高；
 * - `button` 块高 = `--scui-button-height-medium`（32px）= 按钮中年档；
 * - `avatar` = 40px 圆形。
 *
 * 行内 bar 比行块矮（22px 容器里放 14px 条），间隙是**画出来的**而不是靠 margin ——
 * 一旦用 margin，骨架总高就会比真实文本多出行距，切换瞬间整页下移。
 *
 * 两种形态：
 * - 不传 `children`：根节点就是骨架本体，纯装饰，`aria-busy` 让读屏知道区域在更新；
 * - 传 `children`：进入包裹模式，外层容器带 `aria-busy`，按 `loading` 切换骨架与内容。
 *
 * 实现注记：形状分派写成**响应式表达式**（JSX 子位置的 `{renderBody()}`），
 * 不能写成 `<Body />` 组件调用 —— Solid 组件只在 setup 执行一次，
 * 那样 `variant` 从 `text` 切到 `table` 时 DOM 不会变。
 */
import { For, Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { SkeletonProps } from './types';

const SKELETON_PROPS = [
  'variant',
  'rows',
  'active',
  'loading',
  'children',
  'style',
  'class',
] as const;

/** 表格骨架的列数。固定 3 列是有意为之：列宽由真实 `<colgroup>` 决定，骨架不假装知道。 */
const TABLE_COLUMNS = [0, 1, 2];

const bar = (): JSX.Element => <span class={`${CSS_PREFIX}skeleton__bar`} />;

export function Skeleton(props: SkeletonProps): JSX.Element {
  const [local, rest] = splitProps(props, SKELETON_PROPS);

  const variant = () => local.variant ?? 'text';
  const rows = () => {
    const value = Math.floor(local.rows ?? 3);
    return Number.isFinite(value) && value > 0 ? value : 1;
  };
  const active = () => Boolean(local.active);
  const hasContent = () => local.children != null;
  /** 包裹模式下由 `loading` 决定；独立模式下骨架恒显示。 */
  const showSkeleton = () => (hasContent() ? Boolean(local.loading) : true);

  const lineIndexes = () => Array.from({ length: rows() }, (_, index) => index);

  const renderLines = (): JSX.Element => (
    <For each={lineIndexes()}>
      {(index) => (
        <div
          class={`${CSS_PREFIX}skeleton__line`}
          data-scui-role="skeleton-line"
          /* 末行收窄是视觉惯例，用属性而不是 :last-child —— Solid 复用 DOM 节点，
             位置语义不如显式标记可靠 */
          data-scui-last={index === rows() - 1 ? '' : undefined}
        >
          {bar()}
        </div>
      )}
    </For>
  );

  const renderTableRows = (): JSX.Element => (
    <>
      <div class={`${CSS_PREFIX}skeleton__row`} data-scui-role="skeleton-head">
        <For each={TABLE_COLUMNS}>{() => bar()}</For>
      </div>
      <For each={lineIndexes()}>
        {() => (
          <div class={`${CSS_PREFIX}skeleton__row`} data-scui-role="skeleton-row">
            <For each={TABLE_COLUMNS}>{() => bar()}</For>
          </div>
        )}
      </For>
    </>
  );

  const renderBody = (): JSX.Element => {
    switch (variant()) {
      case 'card':
        return (
          <>
            <div class={`${CSS_PREFIX}skeleton__line`} data-scui-role="skeleton-title">
              {bar()}
            </div>
            {renderLines()}
          </>
        );
      case 'table':
        return renderTableRows();
      case 'button':
        return <span class={`${CSS_PREFIX}skeleton__bar`} data-scui-role="skeleton-button" />;
      case 'avatar':
        return <span class={`${CSS_PREFIX}skeleton__bar`} data-scui-role="skeleton-avatar" />;
      default:
        return renderLines();
    }
  };

  /* 骨架本体写两遍而不是抽成一个带开关的函数：属性透传只在独立模式生效
     （包裹模式下 class / style / 原生属性归外层容器），
     抽成 `(applyProps) => ...` 会让 `{...(applyProps ? rest : {})}` 这类条件 spread
     在 Solid 里丢失响应性。两处 DOM 结构完全一致，靠视觉基线互相钉住。 */
  return (
    <Show
      when={hasContent()}
      fallback={
        <div
          {...rest}
          class={classNames(`${CSS_PREFIX}skeleton`, local.class)}
          style={local.style}
          data-scui-role="skeleton"
          data-scui-variant={variant()}
          data-scui-active={active() ? '' : undefined}
          aria-busy="true"
        >
          {renderBody()}
        </div>
      }
    >
      <div
        class={classNames(`${CSS_PREFIX}skeleton__wrapper`, local.class)}
        style={local.style}
        data-scui-role="skeleton-wrapper"
        aria-busy={showSkeleton() ? 'true' : undefined}
      >
        <Show when={showSkeleton()} fallback={local.children}>
          <div
            class={`${CSS_PREFIX}skeleton`}
            data-scui-role="skeleton"
            data-scui-variant={variant()}
            data-scui-active={active() ? '' : undefined}
            aria-busy="true"
          >
            {renderBody()}
          </div>
        </Show>
      </div>
    </Show>
  );
}
