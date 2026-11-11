/**
 * S-05 可行性预研：中文 locale + 键盘网格 + 禁用日期。
 * 日期加减 / 解析一律走 @internationalized/date，格式化走 Intl（DateFormatter），
 * 不自己造完整日期轮子（docs/04 §5.4 关键风险）。SSR 不调用 today()。
 */
import {
  type CalendarDate,
  DateFormatter,
  parseDate,
  startOfMonth,
  startOfWeek,
} from '@internationalized/date';

export type WeekStart = 'mon' | 'sun';

export interface CalendarCell {
  date: CalendarDate;
  /** 是否属于上/下月补位格。 */
  outside: boolean;
  /** 是否禁用。 */
  disabled: boolean;
  /** ISO 日期字符串，用作 data-* 与键盘定位。 */
  iso: string;
}

export const ZH_LOCALE = 'zh-CN';

/** 中文月标题，例如「2026年11月」。 */
export function formatMonthZh(month: CalendarDate): string {
  return new DateFormatter(ZH_LOCALE, { year: 'numeric', month: 'long' }).format(
    month.toDate('UTC'),
  );
}

/** 固定锚点（周日），只用于生成星期标题顺序；不用 today()，SSR 稳定。 */
const WEEK_LABEL_ANCHOR = parseDate('2026-01-04');

/** 中文简短星期标题，按 weekStart 决定首列。 */
export function weekdayLabelsZh(weekStart: WeekStart): readonly string[] {
  const base = startOfWeek(WEEK_LABEL_ANCHOR, weekStart === 'mon' ? ZH_LOCALE : 'en-US');
  const formatter = new DateFormatter(ZH_LOCALE, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(base.add({ days: index }).toDate('UTC')),
  );
}

/** 6 周 × 7 天固定网格，避免月份切换时高度抖动。 */
export function buildMonthGrid(
  anchor: CalendarDate,
  options: {
    weekStart?: WeekStart;
    disabledDate?: (date: CalendarDate) => boolean;
  } = {},
): readonly (readonly CalendarCell[])[] {
  const weekStart = options.weekStart ?? 'mon';
  const locale = weekStart === 'mon' ? ZH_LOCALE : 'en-US';
  const first = startOfWeek(startOfMonth(anchor), locale);
  const month = anchor.month;
  const weeks: CalendarCell[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const cells: CalendarCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = first.add({ days: week * 7 + day });
      const iso = date.toString();
      cells.push({
        date,
        iso,
        outside: date.month !== month || date.year !== anchor.year,
        disabled: options.disabledDate?.(date) ?? false,
      });
    }
    weeks.push(cells);
  }
  return weeks;
}

/** 严格 ISO 解析；失败返回 null（非法输入恢复用）。 */
export function parseInput(text: string): CalendarDate | null {
  const trimmed = text.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  try {
    return parseDate(trimmed);
  } catch {
    return null;
  }
}

/** 键盘导航：方向 / Home / End / PageUp / PageDown 统一在这里，组件只负责派发。 */
export function moveFocus(current: CalendarDate, key: string): CalendarDate {
  switch (key) {
    case 'ArrowLeft':
      return current.subtract({ days: 1 });
    case 'ArrowRight':
      return current.add({ days: 1 });
    case 'ArrowUp':
      return current.subtract({ days: 7 });
    case 'ArrowDown':
      return current.add({ days: 7 });
    case 'Home':
      return startOfWeek(current, ZH_LOCALE);
    case 'End':
      return startOfWeek(current, ZH_LOCALE).add({ days: 6 });
    case 'PageUp':
      return current.subtract({ months: 1 });
    case 'PageDown':
      return current.add({ months: 1 });
    default:
      return current;
  }
}
