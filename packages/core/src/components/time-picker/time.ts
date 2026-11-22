/**
 * TimePicker 的时间内核（T4-13）。
 *
 * 不引入任何日期时间依赖：时间只是 0–23 / 0–59 / 0–59 三个整数区间，原生算术即可。
 * 值口径固定为 24 小时制 ISO `HH:mm`（`showSeconds` 时 `HH:mm:ss`），12 小时制
 * 只影响面板显示与「上午 / 下午」列，不改变值 —— 与 DatePicker 的 ISO 口径一致。
 *
 * SSR 安全：本模块不导出任何「当前时间」，面板默认锚点是固定 `00:00`。
 */
import type { TimeLimits, TimeValue } from './types';

const pad = (value: number): string => String(value).padStart(2, '0');

/** 面板无值时的固定锚点（客户端首帧与服务端一致）。 */
export const DEFAULT_TIME: TimeValue = Object.freeze({ hour: 0, minute: 0, second: 0 });

/** 严格解析 `HH:mm` / `HH:mm:ss`，非法返回 null。 */
export function parseTime(text: string): TimeValue | null {
  const trimmed = text.trim();
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] === undefined ? 0 : Number(match[3]);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { hour, minute, second };
}

/** 24 小时制 ISO 字符串；`withSeconds` 决定截到分还是秒。 */
export function timeIso(time: TimeValue, withSeconds = false): string {
  const base = `${pad(time.hour)}:${pad(time.minute)}`;
  return withSeconds ? `${base}:${pad(time.second)}` : base;
}

/**
 * 按 token 子集 `HH` / `H` / `mm` / `m` / `ss` / `s` / `A` 格式化。
 * `A` 在 `hour12` 下输出中文「上午 / 下午」，否则输出空串。
 */
export function formatTime(time: TimeValue, pattern: string, hour12 = false): string {
  const displayHour = hour12 ? time.hour % 12 || 12 : time.hour;
  const meridiem = time.hour < 12 ? '上午' : '下午';
  return pattern.replace(/HH|H|mm|m|ss|s|A/g, (token) => {
    switch (token) {
      case 'HH':
        return pad(displayHour);
      case 'H':
        return String(displayHour);
      case 'mm':
        return pad(time.minute);
      case 'm':
        return String(time.minute);
      case 'ss':
        return pad(time.second);
      case 's':
        return String(time.second);
      default:
        return hour12 ? meridiem : '';
    }
  });
}

/** 时间是否在闭区间内且未被 `disabledTime` 命中。 */
export function isTimeAllowed(time: TimeValue, limits: TimeLimits): boolean {
  const value = time.hour * 3600 + time.minute * 60 + time.second;
  if (limits.min) {
    const min = parseTime(limits.min);
    if (min && value < min.hour * 3600 + min.minute * 60 + min.second) return false;
  }
  if (limits.max) {
    const max = parseTime(limits.max);
    if (max && value > max.hour * 3600 + max.minute * 60 + max.second) return false;
  }
  return !(limits.disabledTime?.(time) ?? false);
}

/** 12 小时制下的时段选项；24 小时制返回空列表。 */
export const MERIDIEMS = [
  { value: 'am', label: '上午' },
  { value: 'pm', label: '下午' },
] as const;

/** 0–23 的小时选项，按 12 小时制映射显示文本。 */
export function hourOptions(hour12: boolean): readonly { value: number; label: string }[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    value: hour,
    label: pad(hour12 ? hour % 12 || 12 : hour),
  }));
}

/** 0–59 的分钟 / 秒选项。 */
export function minuteOptions(): readonly { value: number; label: string }[] {
  return Array.from({ length: 60 }, (_, value) => ({ value, label: pad(value) }));
}
