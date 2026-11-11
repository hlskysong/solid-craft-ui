/**
 * `InputNumber` 的数值运算（T2-04）。
 *
 * 全程按「整数刻度」思考：精度 `p` 对应刻度 `10^p`，加减只发生在刻度上，
 * 最后一步才除回小数。于是 `0.1 + 0.2` 在刻度上是 `1 + 2 = 3` ⇒ `3 / 10 = 0.3`，
 * 不存在 `0.30000000000000004` 这种尾数。
 *
 * 为什么不用 big.js（`docs/08 §4.1` 的验收写的是「整数缩放或 big.js」）：
 * 本包对消费端体积有硬预算（`docs/02 §4.6`），而这里的值域被 `precision ≤ 20`
 * 与 `Number.MAX_SAFE_INTEGER` 双重约束，整数刻度在精度范围内等价于定点运算。
 * 引一个为任意精度十进制设计的库来解决「小数点后几位」的问题，性价比不成立。
 */

/** 精度上限：`Number.prototype.toFixed` 接受 0~100，但超过 20 位已在双精度之外。 */
const MAX_PRECISION = 20;

/** 把外部传入的精度收进合法区间；非整数按向下取整处理。 */
export function clampPrecision(precision: number): number {
  if (!Number.isFinite(precision)) return 0;
  return Math.min(MAX_PRECISION, Math.max(0, Math.trunc(precision)));
}

/**
 * 一个数在十进制下的小数位数。
 *
 * 不能用 `String(value).split('.')[1].length` 一条路走到底：`1e-7` 的字符串是
 * `'1e-7'`（没有小数点），直接数会得到 0，导致 `step={0.0000001}` 的精度被压成整数。
 */
export function decimalsOf(value: number): number {
  if (!Number.isFinite(value)) return 0;

  const text = String(value);
  const exponentAt = text.indexOf('e-');

  if (exponentAt !== -1) {
    const mantissa = text.slice(0, exponentAt);
    const dot = mantissa.indexOf('.');
    const mantissaDecimals = dot === -1 ? 0 : mantissa.length - dot - 1;
    return mantissaDecimals + Number(text.slice(exponentAt + 2));
  }

  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * 推导实际生效的精度。
 *
 * 显式 `precision` 优先；否则从 `step` 反推（`step={0.1}` ⇒ 1 位小数），
 * 这样调用方只写 `step` 就能得到「步进不会产生尾数」的默认行为。
 */
export function resolvePrecision(precision: number | undefined, step: number): number {
  if (precision !== undefined) return clampPrecision(precision);
  return clampPrecision(decimalsOf(step));
}

/**
 * 取「刻度整数」：`0.3 @ p=1` ⇒ `3`。
 *
 * `value * scale` 本身会带表示误差（`1.005 * 100 = 100.49999999999999`），
 * 先用 `toFixed(6)` 把尾数收掉再谈舍入，否则「1.005 保留两位」会变成 1.00。
 * 舍入方向取**远离零**（`-1.005 → -1.01`），与人对十进制的直觉一致 ——
 * `Math.round` 对负数是向 +∞ 舍入，直接用会出现正负不对称（`-100.5 → -100`）。
 */
function toScaledInteger(value: number, precision: number): number {
  const scale = 10 ** precision;
  const scaled = Number((value * scale).toFixed(6));
  const sign = scaled < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(scaled));
}

/** 按精度取整（远离零舍入）。 */
export function roundTo(value: number, precision: number): number {
  const p = clampPrecision(precision);
  if (!Number.isFinite(value)) return value;
  return toScaledInteger(value, p) / 10 ** p;
}

/** 把值夹进 `[min, max]`；任一端未定义则视为无界。 */
export function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined && next < min) next = min;
  if (max !== undefined && next > max) next = max;
  return next;
}

/**
 * 步进一次：在整数刻度上做加法，结果再除回小数。
 *
 * `current` 为 `null`（空值）时从 `0` 起算 —— 空值下点「增加」得到 `step`，
 * 而不是从 `min` 跳一格，这是「用户此刻想要的是第一格」的直接解释。
 *
 * `step` 比精度还细时（`step=0.001` 而 `precision=1`）至少走一个刻度，
 * 否则按钮会变成函数存在但点了没反应的死按钮。
 */
export function stepValue(
  current: number | null,
  step: number,
  precision: number,
  direction: 1 | -1,
): number {
  const p = clampPrecision(precision);
  const scale = 10 ** p;
  const base = toScaledInteger(current ?? 0, p);
  const delta = Math.max(toScaledInteger(step, p), 1);

  return (base + direction * delta) / scale;
}

/** 千分位分组：只切整数部分，负号与小数原样保留。 */
function groupThousands(text: string): string {
  const negative = text.startsWith('-');
  const body = negative ? text.slice(1) : text;
  const [integerPart = '', fractionPart] = body.split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${negative ? '-' : ''}${grouped}${fractionPart === undefined ? '' : `.${fractionPart}`}`;
}

/**
 * 数值 → 展示文本。
 *
 * `null` 渲染成空串（空值就是空），而不是 `'0'` —— `0` 是一个具体数值，
 * 把它当成空值的替身会让「未填写」与「填写了 0」在界面上无法区分。
 */
export function formatNumber(value: number | null, precision: number, thousands: boolean): string {
  if (value === null || !Number.isFinite(value)) return '';

  const text = roundTo(value, precision).toFixed(clampPrecision(precision));
  return thousands ? groupThousands(text) : text;
}

/** 合法的十进制字面量：不接受十六进制与科学计数法，避免 `0x10` 被当成 16。 */
const DECIMAL_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

/**
 * 文本 → 数值。
 *
 * 三种结果刻意区分开：
 *  - `null`：空输入（用户把内容删光了）⇒ 值应变成「无」；
 *  - `NaN`：非法输入（`'abc'` / `'1.2.3'`）⇒ 调用方应丢弃草稿、回显上一个合法值；
 *  - 其余：合法数值。
 *
 * 把「空」与「非法」混成一个 `null` 会让用户清空后被弹回旧值，
 * 而把「非法」当成 0 又会让用户打错一个字就丢掉已填内容。
 */
export function parseNumber(raw: string, thousands: boolean): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  const normalized = thousands ? trimmed.replace(/,/g, '') : trimmed;
  if (!DECIMAL_PATTERN.test(normalized)) return Number.NaN;

  return Number(normalized);
}
