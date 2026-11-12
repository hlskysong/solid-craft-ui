/**
 * RangePicker 的区间语义（T2-11）。
 *
 * 日期运算全部复用 T2-10 的 `date-picker/calendar.ts`（`@internationalized/date` + `Intl`），
 * 本文件只负责「两个 ISO 端点 → 一个区间」这一层，不引第二套日期逻辑、不新增依赖。
 *
 * **为什么端点比较直接用字符串 `>` / `<=`**：ISO `YYYY-MM-DD` 是零填充定宽串，
 * 字典序恒等于时间序（`'2026-02-09' < '2026-02-10' < '2026-10-01'`），所以字符串比较
 * 已经是精确的日期比较；再解析成 `CalendarDate` 只会多一次对象分配和一个可能抛异常的分支，
 * 不增加任何正确性。真正的日期运算（翻月、±1 天、周边界）仍然只在 `calendar.ts` 里发生 ——
 * 那是「不自造日期轮子」的边界所在。
 */
import type { RangePickerValue } from './types';

/** 空区间：两端都是空串。对外唯一表示「未选择」的形态。 */
export const EMPTY_RANGE: RangePickerValue = ['', ''];

/** 有序区间的两端（`from <= to`）；任一端为空时原样保留。 */
export interface OrderedRange {
  /** 起点 ISO，可能为空串。 */
  readonly from: string;
  /** 终点 ISO，可能为空串。 */
  readonly to: string;
}

/** 单格相对区间的位置标记。 */
export interface RangeFlags {
  /** 是否落在闭区间内（两端齐备时才算）。 */
  readonly inRange: boolean;
  /** 是否是起点（同日选择时与 `end` 同时为真）。 */
  readonly start: boolean;
  /** 是否是终点（同日选择时与 `start` 同时为真）。 */
  readonly end: boolean;
}

/**
 * 把两个端点归一成有序区间。
 *
 * 反向点击（先点 3-20 再点 3-10）在日历语义里是「两点确定区间」，所以这里做交换；
 * 不交换会让区间高亮消失、并给出一对 `from > to` 的非法值。
 */
export function normalizePair(first: string, second: string): OrderedRange {
  if (first !== '' && second !== '' && first > second) return { from: second, to: first };
  return { from: first, to: second };
}

/** 对外值 → 有序区间。 */
export function normalizeRange(value: RangePickerValue): OrderedRange {
  return normalizePair(value[0], value[1]);
}

/** 区间是否两端齐备（只有齐备才做高亮与「已选」判断）。 */
export function isCompleteRange(range: OrderedRange): boolean {
  return range.from !== '' && range.to !== '';
}

/** 是否落在闭区间内。 */
export function inRange(iso: string, range: OrderedRange): boolean {
  return isCompleteRange(range) && range.from <= iso && iso <= range.to;
}

/**
 * 单格位置标记。
 *
 * 同日选择时 `start` 与 `end` 同时为真：一个格子既是起点又是终点，两个语义都成立，
 * 让 CSS 能同时画左右两端的圆角，不需要在样式里再写一次「from === to」的特例。
 */
export function rangeFlags(iso: string, range: OrderedRange): RangeFlags {
  const inside = inRange(iso, range);
  return {
    inRange: inside,
    start: inside && iso === range.from,
    end: inside && iso === range.to,
  };
}

/** 两端是否都不为空（用于「有值」判断：允许只有起点的半截态也算有内容）。 */
export function hasAnyEndpoint(value: RangePickerValue): boolean {
  return value[0] !== '' || value[1] !== '';
}

/** 两个区间是否逐字相同（写值去重用，避免无意义的 `onChange`）。 */
export function sameRange(first: RangePickerValue, second: RangePickerValue): boolean {
  return first[0] === second[0] && first[1] === second[1];
}
