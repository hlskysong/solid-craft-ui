/**
 * DatePicker 的日期内核（T2-10）。
 *
 * 解析 / 加减 / 周边界一律走 `@internationalized/date`，中文月标题与星期标题走 `Intl`
 * （`DateFormatter`）—— 不自造日期轮子（`docs/04 §5.4` 关键风险）。
 *
 * **SSR 安全**：本模块不导出任何「当前时间」常量，默认锚点是固定日期 `2026-01-01`；
 * 唯一的 `today()` 调用点封装在 `todayIso()` 里，只允许由客户端交互触发
 * （点「今天」按钮）。因此服务端首帧与客户端首帧的 DOM 完全一致。
 *
 * **类型隔离**：对外签名只用本地结构性类型 `DateValue`，不把
 * `@internationalized/date` 的 `CalendarDate` 写进出口参数 —— 否则 `dist/types` 会
 * 出现第三方包名，`check:exports` 第 6 条（声明文件类型隔离）直接红灯，且换库即破坏
 * 消费方类型。运行时传入的仍是真实 `CalendarDate` 实例，断言都收敛在本文件内部。
 */
import {
  type CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  startOfMonth,
  startOfWeek,
  today,
} from '@internationalized/date';

/**
 * 日期值的结构性最小集：年 / 月 / 日 + ISO 字符串。
 *
 * 运行时的 `CalendarDate` 天然满足它，业务侧写 `disabledDate={(date) => date.day > 15}`
 * 不需要引入任何第三方类型；要完整 API 时自行 `parseDate(iso)` 即可。
 */
export interface DateValue {
  /** 四位年份。 */
  readonly year: number;
  /** 月份 1–12。 */
  readonly month: number;
  /** 日 1–31。 */
  readonly day: number;
  /** ISO `YYYY-MM-DD`。 */
  toString(): string;
}

/** 周首日口径；`'mon'` 为周一，`'sun'` 为周日。 */
export type WeekStart = 'mon' | 'sun';

/** 日期上下界与自定义禁用规则。 */
export interface DateLimits {
  /** 最小可选日期（含）。 */
  min?: DateValue | null;
  /** 最大可选日期（含）。 */
  max?: DateValue | null;
  /** 自定义禁用判定。 */
  disabledDate?: (date: DateValue) => boolean;
}

/** 日历格。 */
export interface CalendarCell {
  /** 该格对应日期。 */
  date: DateValue;
  /** ISO 字符串，用作 `data-scui-day` 与键盘定位键。 */
  iso: string;
  /** 是否属于上 / 下月补位格。 */
  outside: boolean;
  /** 是否不可选（越界或被 `disabledDate` 命中）。 */
  disabled: boolean;
}

/** 中文 locale 单点定义。 */
export const ZH_LOCALE = 'zh-CN';

/** 键盘导航键；组件只负责派发，具体位移在 `moveFocus` 里。 */
export const NAV_KEYS: readonly string[] = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
];

/** SSR 稳定锚点：固定日期，绝不取系统当前时间。 */
export const DEFAULT_ANCHOR: DateValue = parseDate('2026-01-01');

/** 星期标题的锚点日（2026-01-04 是周日），只用于生成列顺序，与「今天」无关。 */
const WEEKDAY_ANCHOR: DateValue = parseDate('2026-01-04');

/**
 * 周首日 → `startOfWeek` 的 locale 口径。
 *
 * `zh-CN` 的 CLDR 首日是周一、`en-US` 是周日，所以用 locale 表达首日比手算更稳；
 * 实测 `startOfWeek(2026-11-12, 'zh-CN') = 2026-11-09`、`'en-US' = 2026-11-08`。
 */
const weekLocale = (weekStart: WeekStart): string => (weekStart === 'mon' ? ZH_LOCALE : 'en-US');

const monthFormatter = new DateFormatter(ZH_LOCALE, { year: 'numeric', month: 'long' });
const weekdayFormatter = new DateFormatter(ZH_LOCALE, { weekday: 'short' });

const pad = (value: number): string => String(value).padStart(2, '0');

const asCalendarDate = (value: DateValue): CalendarDate => value as CalendarDate;

/**
 * 严格 ISO 解析；失败返回 `null`（非法输入恢复用）。
 *
 * 正则先挡掉非 `YYYY-MM-DD`；解析后回写比对，拦住 `2026-02-31` 这类越界日期
 * （解析器会归一化，只有回写一致才算合法）。
 */
export function parseIso(text: string): DateValue | null {
  const trimmed = text.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  try {
    const date = parseDate(trimmed);
    return date.toString() === trimmed ? date : null;
  } catch {
    return null;
  }
}

/**
 * 按 token 子集格式化：`YYYY` / `MM` / `M` / `DD` / `D`。
 *
 * 只做「取字段 + 补零」，不做任何日期运算 —— 运算与解析仍由 `@internationalized/date`
 * 承担，所以这不构成第二套日期逻辑。默认 `YYYY-MM-DD` 直接等于 ISO 口径。
 */
export function formatDate(date: DateValue, pattern: string): string {
  return pattern.replace(/YYYY|MM|DD|M|D/g, (token) => {
    if (token === 'YYYY') return String(date.year);
    if (token === 'MM') return pad(date.month);
    if (token === 'DD') return pad(date.day);
    if (token === 'M') return String(date.month);
    return String(date.day);
  });
}

/** 中文月标题，例如「2026年11月」。 */
export function monthLabel(date: DateValue): string {
  return monthFormatter.format(asCalendarDate(date).toDate('UTC'));
}

/** 日期格的无障碍全名，例如「2026年11月12日」。 */
export function dayLabel(date: DateValue): string {
  return `${date.year}年${date.month}月${date.day}日`;
}

/** 中文简短星期标题，按 `weekStart` 决定首列。 */
export function weekdayLabels(weekStart: WeekStart): readonly string[] {
  const first = asCalendarDate(startOfWeek(asCalendarDate(WEEKDAY_ANCHOR), weekLocale(weekStart)));
  return Array.from({ length: 7 }, (_, index) =>
    weekdayFormatter.format(first.add({ days: index }).toDate('UTC')),
  );
}

/** 是否可选：`min` / `max` 闭区间 + `disabledDate`。 */
export function isAllowed(date: DateValue, limits: DateLimits): boolean {
  const target = asCalendarDate(date);
  if (limits.min && target.compare(asCalendarDate(limits.min)) < 0) return false;
  if (limits.max && target.compare(asCalendarDate(limits.max)) > 0) return false;
  return !(limits.disabledDate?.(date) ?? false);
}

/** 6 周 × 7 天固定网格：月份切换时高度不抖动，`outside` 标出补位格。 */
export function buildMonthGrid(
  anchor: DateValue,
  options: { weekStart?: WeekStart; limits?: DateLimits } = {},
): readonly (readonly CalendarCell[])[] {
  const weekStart = options.weekStart ?? 'mon';
  const limits = options.limits ?? {};
  const base = asCalendarDate(anchor);
  const first = startOfWeek(startOfMonth(base), weekLocale(weekStart));
  const weeks: CalendarCell[][] = [];

  for (let week = 0; week < 6; week += 1) {
    const cells: CalendarCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = first.add({ days: week * 7 + day });
      cells.push({
        date,
        iso: date.toString(),
        outside: date.month !== base.month || date.year !== base.year,
        disabled: !isAllowed(date, limits),
      });
    }
    weeks.push(cells);
  }

  return weeks;
}

/** 键盘导航：方向键 ±1 天 / ±7 天，`Home` / `End` 周首周末，`PageUp` / `PageDown` ±1 月。 */
export function moveFocus(
  current: DateValue,
  key: string,
  weekStart: WeekStart = 'mon',
): DateValue {
  const date = asCalendarDate(current);
  const locale = weekLocale(weekStart);

  switch (key) {
    case 'ArrowLeft':
      return date.subtract({ days: 1 });
    case 'ArrowRight':
      return date.add({ days: 1 });
    case 'ArrowUp':
      return date.subtract({ days: 7 });
    case 'ArrowDown':
      return date.add({ days: 7 });
    case 'Home':
      return startOfWeek(date, locale);
    case 'End':
      return startOfWeek(date, locale).add({ days: 6 });
    case 'PageUp':
      return date.subtract({ months: 1 });
    case 'PageDown':
      return date.add({ months: 1 });
    default:
      return current;
  }
}

/** 翻月（只用于上 / 下月按钮）。 */
export function shiftMonths(date: DateValue, delta: number): DateValue {
  return asCalendarDate(date).add({ months: delta });
}

/**
 * 客户端「今天」。
 *
 * 这是本组件**唯一**读取系统时间的入口，且只由点击触发；SSR 阶段永远不会执行，
 * 所以默认值 / 首帧渲染都不受运行环境影响。
 */
export function todayIso(): string {
  return today(getLocalTimeZone()).toString();
}
