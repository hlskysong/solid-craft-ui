/**
 * 分页（T3-04）。
 *
 * 分层：`usePaginationEngine` 把 props 归一成单一状态快照（页码收敛、省略号窗口、
 * 受控 / 非受控都在那层），本文件只负责把它翻译成 `<nav>` + 原生控件。
 * **视图不建 signal、不自己算页码**，跳转草稿也在引擎里。
 *
 * 无障碍：根节点是 `<nav aria-label>`，当前页同时给 `aria-current="page"`
 * 与 `data-scui-current`；全部交互控件都是原生 `button` / `select` / `input`，
 * 没有 `tabindex="-1"`，Tab 顺序天然正确，Enter / Space 由浏览器承担。
 *
 * 窄屏：容器 `flex-wrap`，375px 下「每页条数 + 快速跳转」换到第二行而不是横向溢出
 * （`docs/06 §5.2` 的 375px 冒烟判据按 `clientWidth + 1` 抓溢出）。
 *
 * SSR：`<nav>` / `<ul>` / 页码按钮 / `<select>` 的 `selected` / 跳转输入框全部在
 * setup 期产出，服务端首帧就有完整结构；不访问 `window` / `document` / 当前时间。
 */
import { For, Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { usePaginationEngine } from './pagination-engine';
import type { PaginationProps } from './types';

const PAGINATION_PROPS = [
  'total',
  'current',
  'defaultCurrent',
  'pageSize',
  'defaultPageSize',
  'pageSizeOptions',
  'showSizeChanger',
  'showQuickJumper',
  'showTotal',
  'disabled',
  'size',
  'onChange',
  'aria-label',
  'style',
  'class',
] as const;

export function Pagination(props: PaginationProps): JSX.Element {
  const [local, rest] = splitProps(props, PAGINATION_PROPS);
  const engine = usePaginationEngine(local);
  const state = engine.state;

  const renderTotal = () => local.showTotal;

  return (
    <nav
      {...rest}
      class={classNames(`${CSS_PREFIX}pagination`, local.class)}
      style={local.style}
      data-scui-role="pagination"
      data-scui-size={state().size}
      data-scui-disabled={state().disabled ? '' : undefined}
      aria-label={local['aria-label'] ?? '分页'}
    >
      <Show when={renderTotal()}>
        {(render) => (
          <span class={`${CSS_PREFIX}pagination__total`} data-scui-role="pagination-total">
            {render()(state().total, state().range)}
          </span>
        )}
      </Show>

      <ul class={`${CSS_PREFIX}pagination__list`}>
        <li class={`${CSS_PREFIX}pagination__item`}>
          <button
            type="button"
            class={`${CSS_PREFIX}pagination__button`}
            data-scui-role="pagination-prev"
            aria-label="上一页"
            disabled={state().disabled || state().current <= 1}
            onClick={() => {
              engine.prev();
            }}
          >
            上一页
          </button>
        </li>

        <For each={state().items}>
          {(item) => (
            <li class={`${CSS_PREFIX}pagination__item`}>
              <Show
                when={item.type === 'page'}
                fallback={
                  <span
                    class={`${CSS_PREFIX}pagination__gap`}
                    data-scui-role="pagination-gap"
                    aria-hidden="true"
                  >
                    …
                  </span>
                }
              >
                <button
                  type="button"
                  class={`${CSS_PREFIX}pagination__button`}
                  data-scui-role="pagination-page"
                  data-scui-page={item.page}
                  data-scui-current={item.page === state().current ? '' : undefined}
                  aria-current={item.page === state().current ? 'page' : undefined}
                  aria-label={`第 ${item.page} 页`}
                  disabled={state().disabled}
                  onClick={() => {
                    engine.goTo(item.page);
                  }}
                >
                  {item.page}
                </button>
              </Show>
            </li>
          )}
        </For>

        <li class={`${CSS_PREFIX}pagination__item`}>
          <button
            type="button"
            class={`${CSS_PREFIX}pagination__button`}
            data-scui-role="pagination-next"
            aria-label="下一页"
            disabled={state().disabled || state().current >= state().pageCount}
            onClick={() => {
              engine.next();
            }}
          >
            下一页
          </button>
        </li>
      </ul>

      <Show when={state().showSizeChanger}>
        <select
          class={`${CSS_PREFIX}pagination__size`}
          data-scui-role="pagination-size"
          aria-label="每页条数"
          disabled={state().disabled}
          onChange={(event) => {
            engine.changePageSize(Number(event.currentTarget.value));
          }}
        >
          <For each={state().sizeOptions}>
            {(option) => (
              // 用 option 的 selected 而不是 <select value>：value 在 SSR 不是标准属性，
              // 服务端会输出成无意义的属性、浏览器仍选第一项，首帧与客户端不一致。
              <option value={option} selected={option === state().pageSize}>
                {option} 条/页
              </option>
            )}
          </For>
        </select>
      </Show>

      <Show when={state().showQuickJumper}>
        <span class={`${CSS_PREFIX}pagination__jumper`}>
          <span class={`${CSS_PREFIX}pagination__jumper-label`} aria-hidden="true">
            跳至
          </span>
          <input
            class={`${CSS_PREFIX}pagination__jump`}
            data-scui-role="pagination-jump"
            type="text"
            inputMode="numeric"
            autocomplete="off"
            aria-label="跳至页码"
            value={engine.jumpDraft()}
            disabled={state().disabled}
            onInput={(event) => {
              engine.setJumpDraft(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                engine.submitJump();
              }
            }}
          />
          <span class={`${CSS_PREFIX}pagination__jumper-label`} aria-hidden="true">
            页
          </span>
        </span>
      </Show>
    </nav>
  );
}
