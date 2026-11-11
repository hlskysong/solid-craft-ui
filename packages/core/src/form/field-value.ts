/**
 * 字段值的收窄工具（T2-02）。
 *
 * `FieldControl.value` 的类型是 `unknown`（运行期可能是 `string` / `boolean` / `number`），
 * 文本类控件（Input / Textarea / Select 的展示值 / DatePicker 的输入框）需要把任意值
 * 收窄成一个可直接塞进 DOM 的字符串。收窄只做这一处，避免每个控件各写一遍
 * `String(value ?? '')` —— 那既会触发 `no-base-to-string`（对象会变成 `[object Object]`），
 * 也会让「null / undefined / 布尔值怎么显示」在不同控件里给出不同答案。
 *
 * 口径：
 *  - `string` 原样返回；
 *  - `number` 用 `String()`（`0` 要显示成 `'0'`，不能当空值丢掉）；
 *  - 其余（`null` / `undefined` / `boolean` / 对象）一律空串 —— 文本控件不猜语义，
 *    checkbox / switch 这类布尔控件自己用 `=== true` 判断，不走本函数。
 *
 * @param value 字段原始值
 * @returns 可安全渲染的字符串（永不为 `undefined`）
 */
export function toFieldText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}
