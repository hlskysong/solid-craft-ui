/**
 * 原生控件的 DOM 回弹（T2-05）。
 *
 * Solid 只在响应式值**变化**时写 DOM 属性，而浏览器在 click 时已经把
 * `checked` 改掉了。受控 / 字段场景下外部若不回写，计算值没变 → 没有更新
 * 触发 → DOM 停留在用户切换后的状态，与受控值不一致（单测抓到的真问题）。
 * 因此在 change 回调末尾必须把 DOM 拉回当前计算值。
 *
 * `document` 只在这些函数体内访问，事件回调只在客户端执行，SSR 不触达。
 */

/** 把单个 checkbox / switch 的 DOM 状态同步回计算值。 */
export function syncChecked(
  input: HTMLInputElement,
  checked: boolean,
  indeterminate = false,
): void {
  input.checked = checked;
  input.indeterminate = indeterminate;
}

/**
 * 把整组 radio 的 DOM 状态同步回当前值。
 *
 * 原生 radio 的互斥由浏览器执行：点击 B 时它会**主动**把 A 的 `checked`
 * 置为 false，但 A 不会收到 change 事件。受控组未回写时，只同步被点击的
 * 那一个会留下「两个都不选」或「选中项与字段不符」的半截状态，因此必须
 * 按 name 把同组控件整组拉回。
 */
export function syncRadioGroup(name: string, value: string): void {
  for (const node of document.getElementsByName(name)) {
    if (node instanceof HTMLInputElement) node.checked = node.value === value;
  }
}
