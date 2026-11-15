/**
 * 卡片（T3-10）。
 *
 * 结构只是四块：封面 →（标题 + 操作区）→ 正文。所有区块都用 `<Show>` 按「是否传了
 * 内容」决定缺席，不留空盒子；根节点透传 `rest`，因此 `class` / `style` / `data-*`
 * 与 SSR 的确定性都和调用方写原生 `<div>` 一致。
 *
 * 加载态刻意**不自建骨架**：直接组合 T3-05 的 `Skeleton`，行块高已经引用正文行高
 * token，切换前后不会抖动。表头与封面在加载时照常输出 —— 只把正文换掉，卡片高度
 * 与位置才不会因为「标题先到、内容后到」而跳一下。
 *
 * `data-scui-loading` 走 Select / Table 已登记的「存在即真」口径（`''` / 缺席），
 * 不引入 `visible` 或 `spinning` 之类的第二套状态名。
 *
 * CSS 逐组件目录编译、不做依赖聚合，所以 `card.scss` 必须自己 `@use` 聚合
 * `skeleton` 与 `button` 的样式（Demo 的操作区用 Button）。
 */
import { Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { Skeleton } from '../skeleton';
import type { CardProps } from './types';

const CARD_PROPS = ['title', 'extra', 'cover', 'loading', 'children', 'class'] as const;

export function Card(props: CardProps): JSX.Element {
  const [local, rest] = splitProps(props, CARD_PROPS);
  const loading = () => local.loading === true;
  const hasHeader = () => local.title !== undefined || local.extra !== undefined;

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}card`, local.class)}
      data-scui-role="card"
      data-scui-loading={loading() ? '' : undefined}
    >
      <Show when={local.cover !== undefined}>
        <div class={`${CSS_PREFIX}card__cover`} data-scui-role="card-cover">
          {local.cover}
        </div>
      </Show>
      <Show when={hasHeader()}>
        <div class={`${CSS_PREFIX}card__header`} data-scui-role="card-header">
          <Show when={local.title !== undefined}>
            <div class={`${CSS_PREFIX}card__title`} data-scui-role="card-title">
              {local.title}
            </div>
          </Show>
          <Show when={local.extra !== undefined}>
            <div class={`${CSS_PREFIX}card__extra`} data-scui-role="card-extra">
              {local.extra}
            </div>
          </Show>
        </div>
      </Show>
      <div class={`${CSS_PREFIX}card__body`} data-scui-role="card-body">
        <Show when={loading()} fallback={local.children}>
          <Skeleton variant="text" rows={3} />
        </Show>
      </div>
    </div>
  );
}
