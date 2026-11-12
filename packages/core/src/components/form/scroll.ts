/**
 * 提交失败时滚动到第一个错误字段并聚焦控件（docs/04 §5.2 / api-draft/Form.md §5）。
 *
 * 用 `data-scui-field` 逐节点比对而不是拼 CSS 选择器：字段名可能带特殊字符，
 * 字符串插值进 `[data-scui-field="..."]` 会破坏选择器甚至选中别的节点。
 * 这里不引用全局 `HTMLElement` 构造器（服务端没有），类型只作为编译期标注。
 */
import { isServer } from 'solid-js/web';

export function scrollToFirstError(root: ParentNode, name: string | undefined): boolean {
  if (isServer || !name) return false;

  const target = Array.from(root.querySelectorAll('[data-scui-field]')).find(
    (node) => node.getAttribute('data-scui-field') === name,
  );
  const item = target as HTMLElement | null;
  if (!item) return false;

  if (typeof item.scrollIntoView === 'function') item.scrollIntoView({ block: 'center' });
  const focusable =
    item.querySelector<HTMLElement>('input, select, textarea, button, [tabindex]') ?? item;
  focusable.focus?.();
  return true;
}
