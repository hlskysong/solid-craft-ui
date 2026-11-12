/**
 * 日期范围选择（T2-11）。
 *
 * 四层分工：`date-picker/calendar.ts` 管日期（`@internationalized/date` + `Intl`）、
 * `calendar-range.ts` 管区间语义（归一化 / 命中判定）、本文件管交互与 `data-scui-*` 契约、
 * `range-picker.scss` 管视觉。**没有第二套日期逻辑**：本文件不做任何日期算术，
 * 只做字符串比较与状态流转。
 *
 * 弹层内联在根节点里（`position: absolute`），不走 Portal：SSR 只输出两个输入框骨架，
 * 日历仅在客户端展开时挂载 —— 服务端零 `today()` 调用，首帧与客户端逐字一致。
 *
 * **`picking` 状态机**（T2-11 的核心，等价于 DatePicker 的 `editing` 状态机）：
 *  - `picking === 'start'`：下一次落点定义起点；
 *  - 落点确定起点 → 进入 `'end'`，**保持展开**，等第二个点；
 *  - `picking === 'end'` 且已有锚点：hover 任何一格都即时预览 `[锚点, 悬停日]`（自动排序）；
 *  - 落点确定终点 → 两端齐备才 `onChange`，随即关闭并把焦点交给终点输入框；
 *  - 只选了起点就关闭（Esc / 点外部）：待定起点丢弃，不回发半截值。
 *
 * **手输与点选的口径差异是有意的**：
 *  - 点选走「两点确定区间」，反向点击（先 3-20 再 3-10）自动交换；
 *  - 手输是单端录入，越过另一端就**丢弃回滚**（不偷偷把文本搬到另一个框里），
 *    与 DatePicker「非法输入丢弃回滚」同一口径。
 */
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Show,
  splitProps,
} from 'solid-js';
import type { JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { resolveValue } from '../../utils/resolve-value';
import { resolveStatus } from '../input/use-input-value';
import {
  buildMonthGrid,
  DEFAULT_ANCHOR,
  dayLabel,
  formatDate,
  isAllowed,
  monthLabel,
  moveFocus,
  NAV_KEYS,
  parseIso,
  shiftMonths,
  weekdayLabels,
  ZH_LOCALE,
  type DateLimits,
  type DateValue,
} from '../date-picker/calendar';
import {
  hasAnyEndpoint,
  isCompleteRange,
  normalizePair,
  normalizeRange,
  rangeFlags,
  sameRange,
  type OrderedRange,
} from './calendar-range';
import { useRangeValue } from './range-value';
import type { RangePickerProps } from './types';

/** 当前焦点归属的输入框 / 半截选点的位置。 */
type Endpoint = 'start' | 'end';

export function RangePicker(props: RangePickerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'value',
    'defaultValue',
    'onChange',
    'min',
    'max',
    'disabledDate',
    'format',
    'weekStartsOn',
    'startPlaceholder',
    'endPlaceholder',
    'separator',
    'startLabel',
    'endLabel',
    'size',
    'status',
    'disabled',
    'allowClear',
    'clearLabel',
    'aria-label',
    'name',
    'class',
  ]);

  const bridge = useRangeValue({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: () => local.onChange,
  });

  let startControl: HTMLInputElement | undefined;
  let endControl: HTMLInputElement | undefined;
  const dayButtons = new Map<string, HTMLButtonElement>();
  /** 是否要在本次开弹层 / 移动焦点后把 DOM 焦点交给日历格（仅键盘路径置真）。 */
  let pendingGridFocus = false;

  const uid = createUniqueId();
  const calendarId = `${CSS_PREFIX}range-calendar-${uid}`;

  const [open, setOpen] = createSignal(false);
  const [picking, setPicking] = createSignal<Endpoint>('start');
  const [pendingStart, setPendingStart] = createSignal('');
  const [hovered, setHovered] = createSignal<DateValue | null>(null);
  const [focused, setFocused] = createSignal<DateValue>(DEFAULT_ANCHOR);
  const [editing, setEditing] = createSignal<Endpoint | ''>('');
  const [draft, setDraft] = createSignal('');
  const [active, setActive] = createSignal<Endpoint>('start');

  /**
   * 视图月（只到「月」粒度）。
   *
   * `focused` 是键盘游标，聚焦格里任意一天都会被改写；如果 `grid` 直接依赖 `focused`，
   * 同月内移动焦点也会让 `buildMonthGrid` 产出全新的 `cell` 对象，`For` 按引用比对后
   * 会**重造 42 个按钮** —— 第一段落点刚拿到焦点的格子被卸载，根节点收到
   * `focusout(relatedTarget = null)`，弹层当场关闭，用户永远点不到终点
   * （T2-11 首次 E2E 实测踩到，同月内点格子必现）。所以视图月单独用信号持有，
   * 且同月更新时**返回旧对象**，让 Solid 的默认 `===` 比较直接短路。
   */
  const [viewDate, setViewDate] = createSignal<DateValue>(DEFAULT_ANCHOR);
  const sameMonth = (first: DateValue, second: DateValue): boolean =>
    first.year === second.year && first.month === second.month;

  createEffect(() => {
    const next = focused();
    setViewDate((prev) => (sameMonth(prev, next) ? prev : next));
  });

  const pattern = () => local.format ?? 'YYYY-MM-DD';
  const weekStart = () => local.weekStartsOn ?? 'mon';
  const size = () => local.size ?? 'medium';
  const disabled = createMemo(
    () => Boolean(resolveValue(local.disabled ?? false)) || (bridge.field?.disabled() ?? false),
  );
  const invalid = () => resolveStatus(local.status, bridge.field) === 'error';

  const minDate = createMemo<DateValue | null>(() =>
    local.min ? parseIso(resolveValue(local.min)) : null,
  );
  const maxDate = createMemo<DateValue | null>(() =>
    local.max ? parseIso(resolveValue(local.max)) : null,
  );
  const limits = createMemo<DateLimits>(() => ({
    min: minDate(),
    max: maxDate(),
    disabledDate: local.disabledDate,
  }));

  const pair = () => bridge.value();
  const startDate = () => parseIso(pair()[0]);
  const endDate = () => parseIso(pair()[1]);

  /** 已确定（或待定）的起点 —— 终点选择与 hover 预览的锚点。 */
  const anchorIso = () => pendingStart() || (startDate()?.toString() ?? '');
  const previewAnchor = () => (picking() === 'end' ? anchorIso() : '');
  const committed = createMemo<OrderedRange>(() => normalizeRange(bridge.value()));

  /** 当前要高亮的区间：选终点过程中跟着 hover 走，其余时候就是已确定的区间。 */
  const highlight = createMemo<OrderedRange>(() => {
    const anchor = previewAnchor();
    if (anchor === '') return committed();
    return normalizePair(anchor, hovered()?.toString() ?? anchor);
  });

  const grid = createMemo(() =>
    buildMonthGrid(viewDate(), { weekStart: weekStart(), limits: limits() }),
  );

  /** ISO → 显示串；非法存量值原样回显（不吞数据）。 */
  const formatIso = (iso: string): string => {
    const date = parseIso(iso);
    return date ? formatDate(date, pattern()) : iso;
  };

  // 编辑态显示 draft；否则显示待定起点 > 已确定起点 > 原始值。
  const displayStart = () => {
    if (editing() === 'start') return draft();
    const pending = pendingStart();
    if (pending !== '') return formatIso(pending);
    return formatIso(pair()[0]);
  };

  const displayEnd = () => {
    if (editing() === 'end') return draft();
    return formatIso(pair()[1]);
  };

  const summary = () => {
    const range = committed();
    if (isCompleteRange(range)) return `${formatIso(range.from)} 至 ${formatIso(range.to)}`;
    return previewAnchor() === '' ? '请选择开始日期' : '请选择结束日期';
  };

  createEffect(() => {
    if (!open()) return;
    const iso = focused().toString();
    if (!pendingGridFocus) return;
    pendingGridFocus = false;
    // 等 `For` 把本月节点插进 DOM 后再移交焦点，避免焦点落到已卸载的旧格上。
    queueMicrotask(() => dayButtons.get(iso)?.focus());
  });

  const close = (restoreFocus: boolean, target?: Endpoint) => {
    setOpen(false);
    setPendingStart('');
    setPicking('start');
    setHovered(null);
    if (!restoreFocus) return;
    const which = target ?? active();
    if (which === 'end') endControl?.focus();
    else startControl?.focus();
  };

  const commit = (from: string, to: string) => {
    setEditing('');
    setDraft('');
    setPendingStart('');
    if (!sameRange(bridge.value(), [from, to])) bridge.setValue([from, to]);
  };

  const openFrom = (which: Endpoint) => {
    if (disabled()) return;
    const canPickEnd = which === 'end' && anchorIso() !== '';
    setActive(which);
    setPicking(canPickEnd ? 'end' : 'start');
    setFocused(
      (which === 'start' ? startDate() : endDate()) ?? startDate() ?? minDate() ?? DEFAULT_ANCHOR,
    );
    setPendingStart('');
    setHovered(null);
    setOpen(true);
  };

  const pick = (date: DateValue) => {
    if (disabled() || !isAllowed(date, limits())) return;
    const iso = date.toString();

    if (picking() === 'start' || anchorIso() === '') {
      setPendingStart(iso);
      setPicking('end');
      setFocused(date);
      setHovered(null);
      return;
    }

    const range = normalizePair(anchorIso(), iso);
    commit(range.from, range.to);
    close(false);
    endControl?.focus();
  };

  const clear = () => {
    commit('', '');
    close(false);
    startControl?.focus();
  };

  const confirmDraft = () => {
    const which = editing();
    if (which === '') return;
    const text = draft();
    setEditing('');
    setDraft('');

    const parsed = parseIso(text);
    // 非法 / 越界：丢弃 draft 回到当前值（可恢复）。
    if (!parsed || !isAllowed(parsed, limits())) return;
    const iso = parsed.toString();

    if (which === 'start') {
      const to = endDate()?.toString() ?? '';
      if (to === '') {
        // 只有起点：留在控件内部当锚点，不对外发半截值。
        setPendingStart(iso);
        setPicking('end');
        return;
      }
      if (iso > to) return;
      commit(iso, to);
      return;
    }

    const anchor = anchorIso();
    // 终点必须先有起点；早于起点同样丢弃回滚（不做静默交换）。
    if (anchor === '' || iso < anchor) return;
    commit(anchor, iso);
  };

  const onControlKeyDown = (which: Endpoint) => (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (open()) {
        event.preventDefault();
        close(true, which);
      }
      setEditing('');
      setDraft('');
      return;
    }
    if (event.key === 'Enter') {
      if (open()) {
        event.preventDefault();
        pick(focused());
        return;
      }
      confirmDraft();
      return;
    }
    if (!NAV_KEYS.includes(event.key)) return;
    event.preventDefault();
    pendingGridFocus = true;
    if (!open()) {
      openFrom(which);
      return;
    }
    setActive(which);
    setFocused(moveFocus(focused(), event.key, weekStart()));
  };

  const onPopupKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === 'Tab') {
      // 焦点管理：Tab 把焦点交给同级输入框（起点 ↔ 终点），既不困在 42 格里，
      // 也不关弹层 —— 用户还能接着手输另一端。
      event.preventDefault();
      const next: Endpoint = active() === 'start' ? 'end' : 'start';
      const resolved: Endpoint = next === 'end' && anchorIso() === '' ? 'start' : next;
      setActive(resolved);
      setPicking(resolved);
      if (resolved === 'end') endControl?.focus();
      else startControl?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pick(focused());
      return;
    }
    if (!NAV_KEYS.includes(event.key)) return;
    event.preventDefault();
    pendingGridFocus = true;
    setFocused(moveFocus(focused(), event.key, weekStart()));
  };

  const onControlClick = (which: Endpoint) => () => {
    if (open()) {
      setActive(which);
      setPicking(which === 'end' && anchorIso() !== '' ? 'end' : 'start');
      return;
    }
    openFrom(which);
  };

  return (
    // 根是 <fieldset>：两个输入框属于同一个逻辑控件，fieldset 自带 group 语义，
    // `aria-label` 有合法宿主。给 div 硬挂 role="group" 会被 Biome 的
    // useSemanticElements 判错（T2-05 的 CheckboxGroup / RadioGroup 同一取舍）。
    <fieldset
      {...rest}
      class={classNames(`${CSS_PREFIX}range-picker`, local.class)}
      data-scui-role="range-picker"
      data-scui-size={size()}
      data-scui-invalid={invalid() ? 'true' : 'false'}
      data-scui-disabled={disabled() ? '' : undefined}
      data-scui-open={open() ? '' : undefined}
      data-scui-picking={picking()}
      aria-label={local['aria-label']}
      lang={ZH_LOCALE}
      onFocusOut={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        close(false);
      }}
    >
      <input
        ref={(element) => {
          startControl = element;
        }}
        class={`${CSS_PREFIX}range-picker__input`}
        data-scui-role="range-start-input"
        id={bridge.field?.ids.control ?? `${CSS_PREFIX}range-start-${uid}`}
        type="text"
        name={local.name}
        value={displayStart()}
        placeholder={local.startPlaceholder ?? '开始日期'}
        aria-label={
          // 被 `<Form.Item>` 包裹时字段 label 就是名字来源，此时不再叠一层 aria-label。
          bridge.field ? undefined : (local.startLabel ?? '开始日期')
        }
        aria-labelledby={bridge.field?.aria()['aria-labelledby']}
        aria-describedby={bridge.field?.aria()['aria-describedby']}
        aria-invalid={invalid() ? 'true' : 'false'}
        // 与 DatePicker 同一取舍：input 裸挂 aria-expanded 会被 axe 判
        // aria-allowed-attr(critical)，必须显式声明可编辑 combobox。
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open() ? 'true' : 'false'}
        aria-controls={open() ? calendarId : undefined}
        autocomplete="off"
        disabled={disabled()}
        onInput={(event) => {
          setActive('start');
          setDraft(event.currentTarget.value);
          setEditing('start');
        }}
        onClick={onControlClick('start')}
        onBlur={confirmDraft}
        onKeyDown={onControlKeyDown('start')}
      />

      <span class={`${CSS_PREFIX}range-picker__separator`} aria-hidden="true">
        {local.separator ?? '至'}
      </span>

      <input
        ref={(element) => {
          endControl = element;
        }}
        class={`${CSS_PREFIX}range-picker__input`}
        data-scui-role="range-end-input"
        // 终点输入框恒用自己的 uid：字段的 ids.control 已被起点占用，两组同 id 会让
        // `label[for]` 与可访问名称全乱（T2-09 在 Group 上实测过同一类问题）。
        id={`${CSS_PREFIX}range-end-${uid}`}
        type="text"
        name={local.name ? `${local.name}-end` : undefined}
        value={displayEnd()}
        placeholder={local.endPlaceholder ?? '结束日期'}
        aria-label={bridge.field ? undefined : (local.endLabel ?? '结束日期')}
        aria-labelledby={bridge.field?.aria()['aria-labelledby']}
        aria-describedby={bridge.field?.aria()['aria-describedby']}
        aria-invalid={invalid() ? 'true' : 'false'}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open() ? 'true' : 'false'}
        aria-controls={open() ? calendarId : undefined}
        autocomplete="off"
        disabled={disabled()}
        onInput={(event) => {
          setActive('end');
          setDraft(event.currentTarget.value);
          setEditing('end');
        }}
        onClick={onControlClick('end')}
        onBlur={confirmDraft}
        onKeyDown={onControlKeyDown('end')}
      />

      <Show when={local.allowClear && hasAnyEndpoint(pair()) && !disabled()}>
        <button
          type="button"
          class={`${CSS_PREFIX}range-picker__clear`}
          data-scui-role="range-clear"
          aria-label={local.clearLabel ?? '清除'}
          tabIndex={-1}
          onClick={clear}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </Show>

      <Show when={open()}>
        <div
          class={`${CSS_PREFIX}range-picker__popup`}
          data-scui-role="range-popup"
          role="dialog"
          aria-modal="false"
          aria-label={`${monthLabel(viewDate())}，选择日期范围`}
          onKeyDown={onPopupKeyDown}
        >
          <div class={`${CSS_PREFIX}range-picker__header`}>
            <button
              type="button"
              class={`${CSS_PREFIX}range-picker__nav`}
              data-scui-role="month-prev"
              aria-label="上个月"
              onClick={() => setFocused(shiftMonths(focused(), -1))}
            >
              ‹
            </button>
            <span class={`${CSS_PREFIX}range-picker__month`} data-scui-role="month-label">
              {monthLabel(viewDate())}
            </span>
            <button
              type="button"
              class={`${CSS_PREFIX}range-picker__nav`}
              data-scui-role="month-next"
              aria-label="下个月"
              onClick={() => setFocused(shiftMonths(focused(), 1))}
            >
              ›
            </button>
          </div>

          {/* 与 DatePicker 同一取舍：真实 table / th / td 承载日历语义，不给 td 硬挂
              role=gridcell。区间高亮全部走 data-scui-*（起 / 中 / 终三态）。 */}
          <table
            id={calendarId}
            class={`${CSS_PREFIX}range-picker__calendar`}
            data-scui-role="range-calendar"
            aria-label={monthLabel(viewDate())}
            onPointerLeave={() => setHovered(null)}
          >
            <thead>
              <tr data-scui-role="weekdays">
                <For each={weekdayLabels(weekStart())}>
                  {(label) => <th scope="col">{label}</th>}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={grid()}>
                {(week) => (
                  <tr>
                    <For each={week}>
                      {(cell) => {
                        const flags = () => rangeFlags(cell.iso, highlight());
                        return (
                          <td>
                            <button
                              type="button"
                              ref={(element) => {
                                dayButtons.set(cell.iso, element);
                              }}
                              class={`${CSS_PREFIX}range-picker__day`}
                              data-scui-day={cell.iso}
                              data-scui-outside={cell.outside ? '' : undefined}
                              data-scui-disabled={cell.disabled ? '' : undefined}
                              data-scui-in-range={flags().inRange ? '' : undefined}
                              data-scui-range-start={flags().start ? '' : undefined}
                              data-scui-range-end={flags().end ? '' : undefined}
                              aria-label={dayLabel(cell.date)}
                              aria-pressed={flags().start || flags().end ? 'true' : 'false'}
                              aria-disabled={cell.disabled ? 'true' : undefined}
                              disabled={cell.disabled}
                              tabindex={cell.iso === focused().toString() ? 0 : -1}
                              onPointerEnter={() => {
                                if (picking() === 'end') setHovered(cell.date);
                              }}
                              onClick={() => pick(cell.date)}
                            >
                              {cell.date.day}
                            </button>
                          </td>
                        );
                      }}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>

          <div class={`${CSS_PREFIX}range-picker__footer`}>
            <span class={`${CSS_PREFIX}range-picker__summary`} data-scui-role="range-summary">
              {summary()}
            </span>
            <Show when={local.allowClear && hasAnyEndpoint(pair()) && !disabled()}>
              <button
                type="button"
                class={`${CSS_PREFIX}range-picker__action`}
                data-scui-role="range-popup-clear"
                onClick={clear}
              >
                {local.clearLabel ?? '清除'}
              </button>
            </Show>
          </div>
        </div>
      </Show>
    </fieldset>
  );
}
