/**
 * 反馈队列（T2-06）。纯信号 + 定时器，模块顶层零 DOM 访问。
 *
 * SSR：服务端既不创建定时器也不写入条目（`isServer` 判定 + 静态 API 直接 no-op），
 * 所以不同请求不会共享一份被写过的队列；队列状态只在客户端按需创建。
 */
import { createSignal, type Accessor } from 'solid-js';
import type { JSX } from 'solid-js';
import { isServer } from 'solid-js/web';

import type { NoticeChannel, NoticeKind, NoticeOptions } from './types';

/** 归一化后的单条反馈。 */
export interface NoticeItem {
  readonly id: number;
  readonly channel: NoticeChannel;
  readonly kind: NoticeKind;
  readonly content: JSX.Element;
  readonly description?: JSX.Element;
  readonly closable: boolean;
  readonly duration: number;
  readonly onClose?: () => void;
}

/** 队列的构造参数。 */
export interface NoticeStoreOptions {
  /** 条目被移除时通知 API 层 resolve 对应的 Promise 风格句柄。 */
  onRemove?: (id: number) => void;
}

/** 队列对外能力。 */
export interface NoticeStore {
  items: Accessor<NoticeItem[]>;
  add(channel: NoticeChannel, draft: Omit<NoticeItem, 'id' | 'channel'>, maxCount: number): number;
  update(id: number, patch: Partial<NoticeOptions>): void;
  remove(id: number): void;
  clear(): void;
  dispose(): void;
}

export function createNoticeStore(options: NoticeStoreOptions = {}): NoticeStore {
  const [items, setItems] = createSignal<NoticeItem[]>([]);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  let nextId = 0;

  const clearTimer = (id: number): void => {
    const timer = timers.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.delete(id);
  };

  const notifyRemoved = (item: NoticeItem): void => {
    item.onClose?.();
    options.onRemove?.(item.id);
  };

  function remove(id: number): void {
    const target = items().find((item) => item.id === id);
    if (!target) return;
    clearTimer(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    notifyRemoved(target);
  }

  function armTimer(item: NoticeItem): void {
    clearTimer(item.id);
    if (isServer || item.duration <= 0) return;
    timers.set(
      item.id,
      setTimeout(() => remove(item.id), item.duration),
    );
  }

  function retire(entries: NoticeItem[]): void {
    for (const item of entries) {
      clearTimer(item.id);
      notifyRemoved(item);
    }
  }

  function add(
    channel: NoticeChannel,
    draft: Omit<NoticeItem, 'id' | 'channel'>,
    maxCount: number,
  ): number {
    const id = ++nextId;
    const item: NoticeItem = { id, channel, ...draft };
    const merged = [...items(), item];
    const overflow = merged.slice(0, Math.max(0, merged.length - Math.max(1, maxCount)));
    setItems(merged.slice(overflow.length));
    retire(overflow);
    armTimer(item);
    return id;
  }

  function update(id: number, patch: Partial<NoticeOptions>): void {
    const target = items().find((item) => item.id === id);
    if (!target) return;
    const next: NoticeItem = {
      ...target,
      ...(patch.content !== undefined ? { content: patch.content } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.duration !== undefined ? { duration: patch.duration } : {}),
      ...(patch.closable !== undefined ? { closable: patch.closable } : {}),
      ...(patch.onClose !== undefined ? { onClose: patch.onClose } : {}),
    };
    setItems((prev) => prev.map((item) => (item.id === id ? next : item)));
    armTimer(next);
  }

  function clear(): void {
    const all = items();
    setItems([]);
    retire(all);
  }

  function dispose(): void {
    clear();
  }

  return { items, add, update, remove, clear, dispose };
}
