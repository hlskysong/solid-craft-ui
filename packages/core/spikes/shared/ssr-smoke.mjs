/**
 * SSR 冒烟 runner（Phase 0 的 S-02 / S-04 / S-05 / S-06 + M2 的 T2-01~T2-11）。
 *
 * 用 Vite 的 ssrLoadModule 把入口 TSX 按服务端条件编译，再调 renderToString，
 * 验证：① 不抛 Client-only API；② 双次 renderToString 逐字一致（无 today() / 随机漂移）；
 * ③ 各入口约定的 data-* 状态真实输出（只有 S-02 的 Kobalte 复合组件另验 data-hk，
 *    其余是纯 SSR 字符串、不带 hydration key）；④ 渲染期 0 console warning/error。
 *
 * `counts` 是 `markers` 的补充：markers 只判「出现过」，当同一标记有多个来源
 * （T2-03 的 `data-scui-invalid="false"` 在页面里出现 4 次）时，单点退化成
 * `undefined` 仍会被别的组件兜住 → 假绿。这类标记必须同时断言**出现次数**，
 * 少一次即红灯（负向实证 N75 记录的正是这件事）。
 *
 * 这里**不设**「弹层内容必须缺席」的 forbid 判据：T2-01 实测即便把 `ready` 改成恒 true，
 * Kobalte 的 Portal 在服务端构建下依然是空操作、SSR 输出不含任何弹层节点 ——
 * 那种判据恒真、破坏不了，属于假判据（负向实证 N62 记录的正是这件事）。
 * 「首帧不挂弹层」由 `src/primitives/primitives.test.tsx` 的 `useClientReady` 首帧断言覆盖。
 *
 * 为什么放在 spikes/ 下却要跑 src 的入口：这个脚本是仓库里唯一能拿到
 * 「真实服务端编译 + renderToString」的地方（vitest 跑在 jsdom，JSX 已被编成
 * document.createElement，做不了 SSR）。M2 的原语层要验 SSR 双渲确定性，
 * 复用这条已接进 `check:ci` 的链路比新建一个阶段成本低，也不新增 verify 阶段。
 *
 * 注意：这里只验 SSR 单档渲染的可行性，完整 SSR 回归按 docs/07 §6 仍在 M4。
 */
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';
import solid from 'vite-plugin-solid';

// 本文件在 packages/core/spikes/shared/，向上两级才是 Vite root（packages/core/）
const root = fileURLToPath(new URL('../..', import.meta.url));

const cases = [
  {
    id: 'S-02',
    file: '/spikes/s02-kobalte/ssr.tsx',
    markers: [
      'data-scui-size',
      'aria-haspopup="listbox"',
      'data-scui-role="dialog-trigger"',
      'data-hk',
    ],
  },
  {
    id: 'S-04',
    file: '/spikes/s04-table/ssr.tsx',
    markers: ['data-scui-role="table"', 'data-scui-fixed="left"'],
  },
  {
    id: 'S-05',
    file: '/spikes/s05-date-picker/ssr.tsx',
    markers: ['data-scui-role="date-picker"', 'lang="zh-CN"'],
  },
  {
    id: 'S-06',
    file: '/spikes/s06-form/ssr.tsx',
    markers: ['data-scui-role="form"', 'data-scui-invalid'],
  },
  {
    // T2-01：原语层（src 内实现，不是 Spike）。服务端只允许出触发骨架，
    // 弹层内容必须在客户端 onMount 后才装载（docs/02 §8 / api-draft/Table.md §6 同一口径）。
    id: 'T2-01',
    file: '/src/primitives/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-primitive="dialog-trigger"',
      'data-scui-primitive="select-trigger"',
      'data-scui-state="closed"',
      'aria-haspopup',
    ],
  },
  {
    // T2-02：表单字段基座。服务端必须输出 aria-invalid 的字符串两态（无错也出 'false'），
    // 且 aria-describedby 只在有错误文案时出现 —— 否则服务端与客户端首帧属性集不同。
    id: 'T2-02',
    file: '/src/form/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-role="form"',
      'data-scui-field="city"',
      'aria-invalid="false"',
      'aria-invalid="true"',
      'aria-describedby="scui-field-',
    ],
  },
  {
    // T2-03：Input / Textarea。验壳与控件的 data 契约、内联值、以及「错误态也输出两态」。
    // 自动高度不进 SSR（无布局可测），服务端高度由 rows 决定。
    id: 'T2-03',
    file: '/src/components/input/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-role="input"',
      'data-scui-role="textarea"',
      'data-scui-invalid="false"',
      'data-scui-count',
      'value="服务端值"',
    ],
    // 3 个 Input + 1 个 Textarea 各自输出一次；少一次说明某个组件的
    // 「无错也输出 false」退化了，而 markers 会被其余组件兜住。
    counts: [['data-scui-invalid="false"', 4]],
  },
  {
    // T2-04：数值输入。服务端必须已经给出格式化后的值与到界的禁用态，
    // 否则首帧与客户端 hydration 后的显示会不一致。
    id: 'T2-04',
    file: '/src/components/input/__tests__/ssr-number-entry.tsx',
    markers: [
      'data-scui-role="input-number"',
      // 服务端按 JSX 属性名**原样**序列化（`inputMode`），浏览器解析后仍是
      // 大小写不敏感的 `inputmode` —— 客户端断言用 DOM 规范名，这里用源码名。
      'inputMode="decimal"',
      'value="1,234,567"',
      'value="12.5"',
      'data-scui-role="input-number-up"',
      'aria-label="减少"',
    ],
    counts: [['data-scui-role="input-number"', 4]],
  },
  {
    // T2-05：三件套混渲。服务端必须同时给出 checked 三态（含 mixed）、
    // Group 的方向 / 结构锚点与 switch 的 role；半选的 indeterminate 是
    // DOM property，服务端不序列化，只验 aria-checked="mixed"。
    //
    // 注意 marker 不能写 `role="switch"`：它是 `data-scui-role="switch"` 的
    // 子串，即便真的删掉 ARIA role 也照样命中（假判据）。用带前缀的完整片段，
    // 并用 counts 锁住「恰好 2 个 switch」。
    id: 'T2-05',
    file: '/src/components/selection/__tests__/ssr-selection-entry.tsx',
    markers: [
      'data-scui-role="checkbox"',
      'data-scui-checked="mixed"',
      'aria-checked="mixed"',
      'data-scui-role="checkbox-group"',
      'data-scui-orientation="vertical"',
      'data-scui-role="radio"',
      'data-scui-role="radio-group"',
      'data-scui-role="switch"',
      'type="checkbox" role="switch"',
      'aria-labelledby="scui-field-',
    ],
    // 入口共 11 个 label 壳 + 2 个 Group 壳。逐项核对过来源：
    //  - checked="false" 5 次：独立 Checkbox 2（未选中 / 禁用）+ Group 未选 1
    //    + Radio 未选 1 + Switch 关闭 1；
    //  - checked="true" 5 次：独立 1 + Group 选中 1 + Radio 选中 1
    //    + Switch 开启 1 + 字段内 1；
    //  - invalid="false" 13 次：11 个 label 壳 + 2 个 Group 壳，缺一个即
    //    说明某个组件把「无错也输出 false」退化成 undefined；
    //  - switch role 2 次：开 / 关各一个。
    counts: [
      ['data-scui-checked="false"', 5],
      ['data-scui-checked="true"', 5],
      ['data-scui-invalid="false"', 13],
      ['type="checkbox" role="switch"', 2],
    ],
  },
  {
    // T2-06：App 上下文宿主。服务端必须输出两个空反馈容器（aria-live / placement），
    // 且静态 message / notification 与 useApp() 在服务端调用零副作用 —— 入口里
    // 真的调了它们，一旦删掉 isServer 判定就会去 document.createElement 直接抛错。
    // 这是「SSR 不报错」与「脱离树亦可调用」两条验收的同一个判据。
    id: 'T2-06',
    file: '/src/components/app/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-role="app"',
      'data-scui-role="message-viewport"',
      'data-scui-role="notification-viewport"',
      'data-scui-placement="top"',
      'data-scui-placement="top-right"',
      'aria-live="polite"',
      'aria-live="assertive"',
      '服务端子树',
    ],
    // 两个 viewport 各输出一次 placement 与 aria-live；少一个都说明某个通道
    // 被改成了「服务端不渲染」，hydration 首帧属性集会不一致。
    counts: [
      ['data-scui-role="app"', 1],
      ['aria-live="polite"', 1],
      ['aria-live="assertive"', 1],
      ['data-scui-placement=', 2],
    ],
  },
  {
    // T2-07：Select 静态骨架。服务端不挂 Portal，因此搜索框 / 空态 / 加载提示
    // 必须一次都不出现（counts 锁 0）；但 root 的 invalid 两态、size、disabled、
    // loading、以及触发器与清除按钮仍要输出，保证 hydration 首帧属性集一致。
    id: 'T2-07',
    file: '/src/components/select/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-role="select"',
      'data-scui-size="small"',
      'data-scui-size="medium"',
      'data-scui-size="large"',
      'data-scui-invalid="false"',
      'data-scui-invalid="true"',
      'data-scui-disabled=""',
      'data-scui-loading=""',
      'aria-busy="true"',
      'aria-invalid="false"',
      'data-scui-role="select-clear"',
      'data-scui-primitive="select-trigger"',
      '请选择',
      '邯郸',
    ],
    counts: [
      ['data-scui-role="select"', 4],
      ['data-scui-primitive="select-trigger"', 4],
      ['data-scui-invalid="false"', 3],
      ['data-scui-invalid="true"', 1],
      ['data-scui-role="select-search"', 0],
      ['data-scui-role="select-empty"', 0],
    ],
  },
  {
    // T2-08：Form 静态骨架。校验只在提交时跑，因此服务端**不输出**错误文案节点；
    // counts 锁 0 钉住这一点，同时锁住 3 个 form / 4 个 form-item 与恒两态的
    // invalid 属性，避免有人把校验搬进渲染期造成 hydration 属性差。
    id: 'T2-08',
    file: '/src/components/form/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-role="form"',
      'data-scui-role="form-item"',
      'data-scui-layout="horizontal"',
      'data-scui-layout="vertical"',
      'data-scui-layout="inline"',
      'data-scui-invalid="false"',
      'data-scui-required=""',
      'data-scui-disabled=""',
      'aria-invalid="false"',
      'aria-label="员工信息"',
      'for="scui-field-',
      'id="scui-field-',
      '姓名',
      '城市',
    ],
    counts: [
      ['data-scui-role="form"', 3],
      ['data-scui-role="form-item"', 4],
      ['data-scui-invalid="false"', 4],
      ['aria-invalid="false"', 4],
      ['data-scui-required=""', 2],
      ['data-scui-role="field-error"', 0],
    ],
  },
  {
    // T2-09：真实表单页（新增 + 编辑）静态骨架。两张表单共 16 个字段，七类控件的
    // data-scui-role 都必须出现；编辑态的受控值在服务端就要输出，而 Portal 内的
    // 搜索框 / 空态与只在提交期产生的错误文案必须一次都不出现（counts 锁 0）。
    id: 'T2-09',
    file: '/src/components/form/__tests__/ssr-real-form.tsx',
    markers: [
      'data-scui-role="form"',
      'data-scui-role="form-item"',
      'data-scui-role="input"',
      'data-scui-role="textarea"',
      'data-scui-role="input-number"',
      'data-scui-role="checkbox"',
      'data-scui-role="checkbox-group"',
      'data-scui-role="radio-group"',
      'data-scui-role="switch"',
      'data-scui-role="select"',
      'data-scui-primitive="select-trigger"',
      'data-scui-field="agree"',
      'data-scui-layout="horizontal"',
      'data-scui-layout="vertical"',
      'data-scui-invalid="false"',
      'data-scui-checked="true"',
      'data-scui-checked="false"',
      'aria-labelledby="scui-field-',
      'aria-label="员工档案（新增）"',
      'aria-label="员工档案（编辑）"',
      'for="scui-field-',
      '张三',
      '邯郸',
      '请选择城市',
    ],
    counts: [
      ['data-scui-role="form"', 2],
      ['data-scui-role="form-item"', 16],
      ['data-scui-role="select"', 2],
      ['data-scui-primitive="select-trigger"', 2],
      ['data-scui-field="name"', 2],
      ['data-scui-role="field-error"', 0],
      ['data-scui-role="select-search"', 0],
      ['data-scui-role="select-empty"', 0],
      ['张三', 1],
      ['邯郸', 1],
    ],
  },
  {
    id: 'T2-10',
    file: '/src/components/date-picker/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-role="date-picker"',
      'data-scui-role="date-input"',
      'data-scui-size="small"',
      'data-scui-size="medium"',
      'data-scui-invalid="false"',
      'data-scui-invalid="true"',
      'data-scui-disabled=""',
      'data-scui-role="date-clear"',
      'aria-haspopup="dialog"',
      'role="combobox"',
      'aria-expanded="false"',
      'lang="zh-CN"',
      'aria-label="签署日期"',
      'placeholder="YYYY-MM-DD"',
      '2026年3月15日',
    ],
    counts: [
      ['data-scui-role="date-picker"', 3],
      ['data-scui-role="date-input"', 3],
      ['data-scui-role="calendar"', 0],
      ['data-scui-day=', 0],
      ['data-scui-role="date-today"', 0],
      ['data-scui-role="date-clear"', 1],
      ['data-scui-invalid="false"', 2],
      ['data-scui-invalid="true"', 1],
      ['aria-expanded="false"', 3],
      ['role="combobox"', 3],
    ],
  },
  {
    // T2-11：日期范围。服务端必须输出**两个**输入框骨架（起点 / 终点各一个 combobox），
    // 且弹层与区间高亮标记全部缺席 —— 把 `Show when={open()}` 改成恒真，下面的 0 计数会立刻红灯。
    id: 'T2-11',
    file: '/src/components/range-picker/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-role="range-picker"',
      'data-scui-role="range-start-input"',
      'data-scui-role="range-end-input"',
      'data-scui-picking="start"',
      'data-scui-size="small"',
      'data-scui-size="medium"',
      'data-scui-invalid="false"',
      'data-scui-invalid="true"',
      'data-scui-disabled=""',
      'data-scui-role="range-clear"',
      '<fieldset',
      'role="combobox"',
      'aria-haspopup="dialog"',
      'aria-expanded="false"',
      'lang="zh-CN"',
      'aria-label="合同期限"',
      'placeholder="开始日期"',
      '2026年3月15日',
    ],
    counts: [
      ['data-scui-role="range-picker"', 3],
      ['data-scui-role="range-start-input"', 3],
      ['data-scui-role="range-end-input"', 3],
      ['data-scui-role="range-calendar"', 0],
      ['data-scui-role="range-popup"', 0],
      ['data-scui-role="range-summary"', 0],
      ['data-scui-day=', 0],
      ['data-scui-role="range-clear"', 1],
      ['data-scui-invalid="false"', 2],
      ['data-scui-invalid="true"', 1],
      ['role="combobox"', 6],
      ['<fieldset', 3],
    ],
  },
  {
    // T3-01：Table 引擎基座。服务端必须输出完整静态表格骨架（colgroup / thead /
    // tbody 与全部 data-*），加载态只落属性、不引入任何 client-only 节点。
    // 三张表分别覆盖默认档 / 全状态档 / 空数据档，counts 钉死各自的行数，
    // 避免有人把 DOM 测量或窗口化搬进渲染期造成 hydration 属性差。
    id: 'T3-01',
    file: '/src/components/table/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-role="table"',
      'data-scui-role="table-scroll"',
      'data-scui-row-count="4"',
      'data-scui-row-count="0"',
      'data-scui-size="medium"',
      'data-scui-size="small"',
      'data-scui-density="default"',
      'data-scui-density="compact"',
      'data-scui-bordered=""',
      'data-scui-loading=""',
      'aria-busy="true"',
      'data-scui-align="center"',
      'data-scui-align="right"',
      'data-scui-row-key="A01"',
      'scope="col"',
      '<colgroup',
      '<thead',
      '<tbody',
      'lang="zh-CN"',
    ],
    counts: [
      ['data-scui-role="table"', 3],
      ['data-scui-role="table-scroll"', 3],
      ['<colgroup', 3],
      ['<thead', 3],
      ['<tbody', 3],
      ['scope="col"', 12],
      ['data-scui-row-count="4"', 2],
      ['data-scui-row-count="0"', 1],
      ['data-scui-loading=""', 1],
      ['aria-busy="true"', 1],
      ['data-scui-bordered=""', 1],
      // T3-06 起空态会渲染 Empty（自带 data-scui-size），用「table 角色 + 尺寸」
      // 连续属性做锚点，避免把子组件的尺寸算进 Table 自己的档位口径。
      ['data-scui-role="table" data-scui-size="small"', 1],
      ['data-scui-role="table" data-scui-size="medium"', 2],
      ['data-scui-density="compact"', 1],
      ['data-scui-density="default"', 2],
    ],
  },
  {
    // T3-02：排序 / 筛选。触发器与状态属性在服务端必须完整输出，筛选面板初态关闭
    //（counts=0 钉住）、服务端模式不改数据（`filtered-row-count` 仍为 4），
    // 否则 hydration 首帧会与客户端差一个面板或差一组行。
    id: 'T3-02',
    file: '/src/components/table/__tests__/ssr-sort-filter.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="table"',
      'data-scui-role="table-scroll"',
      'data-scui-role="sort-trigger"',
      'data-scui-role="filter-trigger"',
      'data-scui-sort="asc"',
      'data-scui-sort="desc"',
      'data-scui-sort-key="department"',
      'data-scui-sort-key="years"',
      'data-scui-filtered=""',
      'data-scui-server=""',
      'data-scui-filtered-row-count="1"',
      'data-scui-filtered-row-count="4"',
      'data-scui-filtered-row-count="0"',
      'aria-expanded="false"',
      'aria-pressed="true"',
      'scope="col"',
      '<colgroup',
      '<thead',
      '<tbody',
    ],
    counts: [
      ['data-scui-role="table"', 3],
      ['data-scui-role="table-scroll"', 3],
      ['data-scui-role="sort-trigger"', 6],
      ['data-scui-role="filter-trigger"', 3],
      ['data-scui-role="filter-dropdown"', 0],
      ['scope="col"', 12],
      ['<colgroup', 3],
      ['<thead', 3],
      ['<tbody', 3],
      ['aria-expanded="false"', 3],
      ['aria-pressed="true"', 2],
      ['data-scui-sort="asc"', 1],
      ['data-scui-sort="desc"', 1],
      ['data-scui-sort-key="department"', 1],
      ['data-scui-sort-key="years"', 1],
      ['data-scui-filtered=""', 2],
      ['data-scui-server=""', 1],
      ['data-scui-row-count="4"', 2],
      ['data-scui-row-count="0"', 1],
      ['data-scui-filtered-row-count="1"', 1],
      ['data-scui-filtered-row-count="4"', 1],
      ['data-scui-filtered-row-count="0"', 1],
    ],
  },
  {
    id: 'T3-03',
    file: '/src/components/table/__tests__/ssr-selection.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="table"',
      'data-scui-role="select-all"',
      'data-scui-role="select-row"',
      'aria-checked="mixed"',
      'aria-checked="true"',
      'aria-checked="false"',
      'data-scui-selected=""',
      'data-scui-row-disabled=""',
      'table__select-label',
      'scope="col"',
      '<colgroup',
      '<thead',
      '<tbody',
    ],
    counts: [
      ['data-scui-role="table"', 3],
      ['data-scui-role="select-all"', 1],
      ['data-scui-role="select-row"', 8],
      ['aria-checked="mixed"', 1],
      ['aria-checked="true"', 3],
      ['aria-checked="false"', 5],
      ['data-scui-selected=""', 3],
      ['data-scui-row-disabled=""', 1],
      ['table__select-label', 2],
      [' disabled', 1],
      ['scope="col"', 14],
      ['<colgroup', 3],
      ['<thead', 3],
      ['<tbody', 3],
    ],
  },
  {
    id: 'T3-04',
    file: '/src/components/pagination/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="pagination"',
      'data-scui-role="pagination-page"',
      'data-scui-role="pagination-gap"',
      'data-scui-role="pagination-prev"',
      'data-scui-role="pagination-next"',
      'data-scui-role="pagination-size"',
      'data-scui-role="pagination-jump"',
      'data-scui-role="pagination-total"',
      'aria-current="page"',
      'aria-label="上一页"',
      'aria-label="每页条数"',
      'aria-label="跳至页码"',
      'data-scui-disabled=""',
      'value="10" selected',
    ],
    counts: [
      ['data-scui-role="pagination"', 5],
      ['data-scui-role="pagination-page"', 21],
      ['data-scui-role="pagination-gap"', 5],
      ['data-scui-role="pagination-prev"', 5],
      ['data-scui-role="pagination-next"', 5],
      ['data-scui-role="pagination-size"', 2],
      ['data-scui-role="pagination-jump"', 2],
      ['data-scui-role="pagination-total"', 1],
      ['aria-current="page"', 5],
      ['data-scui-page="10"', 1],
      // 受控 current=99 必须收敛：越界页码在 SSR 输出里一次都不许出现
      ['data-scui-page="99"', 0],
      ['<option', 8],
      ['value="10" selected', 2],
      ['aria-label="每页条数"', 2],
      ['aria-label="跳至页码"', 2],
      ['data-scui-disabled=""', 1],
    ],
  },
  {
    /* T3-05 三件套各占一个入口：三个组件互相独立，合在一个入口里会让
       「某个组件的标记整段消失」被另外两个组件的输出兜住，counts 就失去意义。 */
    id: 'T3-05-empty',
    file: '/src/components/empty/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="empty"',
      'data-scui-role="empty-image"',
      'data-scui-role="empty-description"',
      'data-scui-role="empty-footer"',
      'aria-hidden="true"',
    ],
    counts: [
      ['data-scui-role="empty"', 4],
      ['data-scui-role="empty-image"', 3],
      ['data-scui-role="empty-description"', 4],
      ['data-scui-role="empty-footer"', 1],
      ['data-scui-size="small"', 1],
      ['data-scui-size="large"', 1],
      // 4 个实例里只有 2 个走内置插画：一个 image={null}、一个自定义 span
      ['aria-hidden="true"', 2],
    ],
  },
  {
    id: 'T3-05-skeleton',
    file: '/src/components/skeleton/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="skeleton"',
      'data-scui-role="skeleton-line"',
      'data-scui-role="skeleton-row"',
      'data-scui-role="skeleton-head"',
      'data-scui-role="skeleton-title"',
      'data-scui-role="skeleton-avatar"',
      'data-scui-role="skeleton-wrapper"',
      'aria-busy="true"',
    ],
    counts: [
      ['data-scui-role="skeleton"', 4],
      ['data-scui-role="skeleton-line"', 5],
      ['data-scui-role="skeleton-row"', 2],
      ['data-scui-role="skeleton-head"', 1],
      ['data-scui-role="skeleton-title"', 1],
      ['data-scui-role="skeleton-avatar"', 1],
      ['data-scui-role="skeleton-wrapper"', 1],
      ['aria-busy="true"', 4],
      // 末行标记：text 3 行 1 处 + card 2 行 1 处
      ['data-scui-last=""', 2],
      ['data-scui-active=""', 1],
    ],
  },
  {
    id: 'T3-05-spin',
    file: '/src/components/spin/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="spin"',
      'data-scui-role="spin-container"',
      'data-scui-role="spin-overlay"',
      'data-scui-role="spin-tip"',
      'role="status"',
    ],
    counts: [
      ['data-scui-role="spin"', 4],
      ['data-scui-role="spin-container"', 3],
      // 只有第 4 例（spinning 默认 true 且无 delay）出遮罩
      ['data-scui-role="spin-overlay"', 1],
      ['data-scui-role="spin-tip"', 1],
      ['role="status"', 4],
      ['aria-busy="true"', 1],
      ['data-scui-spinning=""', 1],
      // 无 tip 的转圈补隐藏文案：small / large / 包裹内 共 3 处
      ['加载中', 3],
    ],
  },
  {
    /* T3-06：分页 / 空态 / 加载态全部在服务端首帧就位。
       五张表分别覆盖「不启用分页（零 footer）/ 客户端分页 / 服务端分页
       （受控第 2 页）/ 空态 / 加载态」，counts 钉住各自的结构数量，
       避免有人把分页或占位搬进 client-only 增强层造成 hydration 差。 */
    id: 'T3-06',
    file: '/src/components/table/__tests__/ssr-pagination.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="table-root"',
      'data-scui-role="table-scroll"',
      'data-scui-role="table-footer"',
      'data-scui-role="pagination"',
      'aria-current="page"',
      'data-scui-current=""',
      'data-scui-role="table-empty-row"',
      'data-scui-role="table-loading"',
      'data-scui-role="empty"',
      'data-scui-role="spin"',
      'data-scui-disabled=""',
      'value="5" selected',
      'colspan="3"',
      '<colgroup',
      '<thead',
      '<tbody',
    ],
    counts: [
      ['data-scui-role="table-root"', 5],
      ['data-scui-role="table-scroll"', 5],
      ['<colgroup', 5],
      ['<thead', 5],
      ['<tbody', 5],
      // 第 1 张表不启用分页，其余 4 张各一个 footer
      ['data-scui-role="table-footer"', 4],
      ['data-scui-role="pagination"', 4],
      ['aria-current="page"', 4],
      ['data-scui-current=""', 4],
      ['data-scui-role="table-empty-row"', 1],
      ['data-scui-role="empty"', 1],
      ['data-scui-role="table-loading"', 1],
      ['data-scui-role="spin"', 1],
      ['data-scui-disabled=""', 1],
      ['colspan="3"', 1],
      ['value="5" selected', 1],
    ],
  },
  {
    // T3-07：Modal 的「SSR 不渲染弹层」不能写成 forbid 判据（Kobalte Portal
    // 在服务端恒为空操作，禁不掉，见文件头 N62）。这里验的是正面静态骨架：
    // 两个打开态 Modal（受控 open / defaultOpen + confirmLoading）在服务端
    // 不抛错、不访问 document，页面容器与触发按钮照常输出。
    id: 'T3-07',
    file: '/src/components/modal/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="modal-page"',
      'data-scui-role="modal-trigger"',
      '打开对话框',
    ],
    counts: [
      ['data-scui-role="modal-page"', 1],
      ['data-scui-role="modal-trigger"', 1],
      ['打开对话框', 1],
    ],
  },
  {
    // T3-08：与 T3-07 同口径，不写「弹层必须缺席」的 forbid 假判据（N62）。
    // 验的是四个方向（含 explicit height 的 bottom）在服务端渲染期不访问
    // document、不抛错，正面静态骨架照常输出。
    id: 'T3-08',
    file: '/src/components/drawer/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="drawer-page"',
      'data-scui-role="drawer-trigger"',
      '打开抽屉',
    ],
    counts: [
      ['data-scui-role="drawer-page"', 1],
      ['data-scui-role="drawer-trigger"', 1],
      ['打开抽屉', 1],
    ],
  },
  {
    // T3-09-a：Alert 是内联反馈，SSR 全量输出；四种 data-scui-kind 与静态
    // message / useApp 调用都在同一入口里，删掉 isServer 边界会当场抛错（N90）。
    id: 'T3-09-alert',
    file: '/src/components/alert/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="alert-page"',
      'data-scui-role="alert-trigger"',
      'data-scui-kind="warning"',
    ],
    counts: [
      ['data-scui-role="alert-page"', 1],
      ['data-scui-role="alert-trigger"', 1],
      ['data-scui-kind="info"', 1],
      ['data-scui-kind="success"', 1],
      ['data-scui-kind="warning"', 1],
      ['data-scui-kind="error"', 1],
    ],
  },
  {
    // T3-09-b：Tooltip 的浮层由 Portal 在客户端挂载，服务端只出触发按钮；
    // 四个触发按钮都由锚定原语输出，count 钉住「原语真的渲染了」。
    id: 'T3-09-tooltip',
    file: '/src/components/tooltip/__tests__/ssr-entry.tsx',
    markers: ['lang="zh-CN"', 'data-scui-role="tooltip-page"', '受控打开', '静态骨架'],
    counts: [
      ['data-scui-role="tooltip-page"', 1],
      ['data-scui-role="tooltip-trigger"', 4],
    ],
  },
  {
    // T3-09-c：Popconfirm 同上；额外验异步 onOk 回调在渲染期不执行、
    // 自定义文案与四向 placement 都不触碰 DOM。
    id: 'T3-09-popconfirm',
    file: '/src/components/popconfirm/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="popconfirm-page"',
      'data-scui-role="popconfirm-trigger"',
      '静态骨架',
    ],
    counts: [
      ['data-scui-role="popconfirm-page"', 1],
      ['data-scui-role="popconfirm-trigger"', 4],
    ],
  },
  {
    // T3-10-a：Card 全量内联输出。三张卡片分别覆盖「标题 + 操作区」「封面 +
    // 加载态」「纯内容」；加载态必须真的渲染出 T3-05 的 Skeleton 角色，
    // 否则 data-scui-loading 只是个没接线的属性。
    id: 'T3-10-card',
    file: '/src/components/card/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="card-page"',
      'data-scui-role="card-trigger"',
      'data-scui-loading=""',
      'data-scui-role="skeleton"',
    ],
    counts: [
      ['data-scui-role="card-page"', 1],
      ['data-scui-role="card-trigger"', 1],
      ['data-scui-role="card"', 3],
      ['data-scui-loading=""', 1],
      ['data-scui-role="card-cover"', 1],
      ['data-scui-role="card-header"', 2],
      ['data-scui-role="card-title"', 2],
      ['data-scui-role="card-extra"', 2],
      ['data-scui-role="card-body"', 3],
      ['data-scui-role="skeleton"', 1],
    ],
  },
  {
    // T3-10-b：Tag 五档颜色逐一计数，边框与可关闭按钮都是 SSR 也输出的静态结构。
    // 只验正面骨架，不写「关闭后必须缺席」的 forbid 假判据。
    id: 'T3-10-tag',
    file: '/src/components/tag/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="tag-page"',
      'data-scui-role="tag-trigger"',
      'data-scui-bordered=""',
      'data-scui-role="tag-close"',
    ],
    counts: [
      ['data-scui-role="tag-page"', 1],
      ['data-scui-role="tag-trigger"', 1],
      ['data-scui-role="tag"', 5],
      ['data-scui-color="neutral"', 1],
      ['data-scui-color="primary"', 1],
      ['data-scui-color="success"', 1],
      ['data-scui-color="warning"', 1],
      ['data-scui-color="danger"', 1],
      ['data-scui-bordered=""', 2],
      ['data-scui-role="tag-close"', 2],
    ],
  },
  {
    // T3-11-a：Tabs 两个实例（默认线型 + 卡片/全量挂载）。只验正面静态骨架：
    // tablist / tab 由 Kobalte 在服务端照常输出，panel 的 presence 交给原语，
    // 因此不写「未激活 panel 必须缺席」的 forbid 假判据。
    id: 'T3-11-tabs',
    file: '/src/components/tabs/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="tabs-page"',
      'data-scui-role="tabs-trigger"',
      'data-scui-variant="card"',
      'data-scui-current=""',
    ],
    counts: [
      ['data-scui-role="tabs-page"', 1],
      ['data-scui-role="tabs-trigger"', 1],
      ['data-scui-role="tabs"', 2],
      ['data-scui-role="tabs-list"', 2],
      ['data-scui-role="tabs-tab"', 6],
      ['data-scui-variant="line"', 1],
      ['data-scui-variant="card"', 1],
      ['role="tablist"', 2],
      ['role="tab"', 6],
      ['data-scui-current=""', 4],
    ],
  },
  {
    // T3-11-b：Descriptions 三个实例（默认两列 / 三列带边框 / 单列），
    // dl / dt / dd 与 column / span / bordered 全是 SSR 也输出的静态结构。
    id: 'T3-11-descriptions',
    file: '/src/components/descriptions/__tests__/ssr-entry.tsx',
    markers: [
      'lang="zh-CN"',
      'data-scui-role="descriptions-page"',
      'data-scui-role="descriptions-trigger"',
      'data-scui-column="3"',
      'data-scui-span="2"',
      'data-scui-bordered=""',
      '<dl',
    ],
    counts: [
      ['data-scui-role="descriptions-page"', 1],
      ['data-scui-role="descriptions-trigger"', 1],
      ['data-scui-role="descriptions"', 3],
      ['data-scui-role="descriptions-list"', 3],
      ['data-scui-role="descriptions-item"', 9],
      ['data-scui-role="descriptions-label"', 9],
      ['data-scui-role="descriptions-content"', 9],
      ['data-scui-column="1"', 1],
      ['data-scui-column="2"', 1],
      ['data-scui-column="3"', 1],
      ['data-scui-span="2"', 3],
      ['data-scui-bordered=""', 1],
    ],
  },
  {
    // T3-12：CRUD 列表页组合 Demo 的静态骨架。查询表单 / 工具栏 / 带分页 Table /
    // 新增·编辑表单四块在服务端首帧就齐全；Modal 与 Popconfirm 的 Portal 只在客户端
    // onMount 后挂载，因此 counts 锁 0（不写 forbid 假判据）。
    id: 'T3-12',
    file: '/src/components/table/__tests__/ssr-crud-list.tsx',
    markers: [
      'lang="zh-CN"',
      'data-testid="crud-ssr-page"',
      'data-scui-role="form"',
      'data-scui-role="form-item"',
      'data-scui-role="table-root"',
      'data-scui-role="table-footer"',
      'data-scui-role="input"',
      'data-scui-role="input-number"',
      'data-scui-role="select"',
      'aria-label="计划查询"',
      'aria-label="维简设备采购计划列表"',
      'aria-label="采购计划表单"',
      '主井提升机变频改造',
      '已审批',
    ],
    counts: [
      ['data-testid="crud-ssr-page"', 1],
      ['data-scui-role="form"', 2],
      ['data-scui-role="form-item"', 4],
      ['data-scui-role="table-root"', 1],
      ['data-scui-role="table-footer"', 1],
      ['data-scui-role="input"', 2],
      ['data-scui-role="input-number"', 1],
      ['data-scui-role="select"', 1],
      ['data-scui-role="modal"', 0],
      ['data-scui-role="popconfirm-trigger"', 0],
    ],
  },
];

const errors = [];
const warnings = [];
const server = await createServer({
  configFile: false,
  root,
  plugins: [solid()],
  server: { middlewareMode: true },
  logLevel: 'silent',
  appType: 'custom',
});

const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args) => warnings.push(args.map(String).join(' '));
console.error = (...args) => warnings.push(args.map(String).join(' '));

try {
  for (const item of cases) {
    let html = '';
    try {
      const mod = await server.ssrLoadModule(item.file);
      html = await mod.render();
      // SSR 确定性：同一组件连渲两次必须逐字一致（无 today() / Math.random 漂移）
      const again = await mod.render();
      if (again !== html) errors.push(`${item.id} 两次 renderToString 输出不一致（SSR 不稳定）`);
    } catch (error) {
      errors.push(
        `${item.id} SSR 渲染抛错：${error instanceof Error ? error.message : String(error)}`,
      );
      console.error = originalError;
      originalError(`${item.id} 抛错详情：`, error);
      console.error = (...args) => warnings.push(args.map(String).join(' '));
      continue;
    }
    if (typeof html !== 'string' || html.length === 0) {
      errors.push(`${item.id} renderToString 未产出 HTML`);
    }
    if (!html.includes('<')) errors.push(`${item.id} HTML 未渲染出任何元素`);
    for (const marker of item.markers) {
      if (!html.includes(marker)) errors.push(`${item.id} HTML 缺少标记 ${marker}`);
    }
    for (const [marker, expected] of item.counts ?? []) {
      const actual = html.split(marker).length - 1;
      if (actual !== expected) {
        errors.push(`${item.id} 标记 ${marker} 出现 ${actual} 次，期望 ${expected} 次`);
      }
    }
    if (/Client-only API|hydration mismatch/i.test(html)) {
      errors.push(`${item.id} HTML 含客户端专用 API / hydration mismatch 文本`);
    }
    originalWarn.call(
      console,
      `[spikes:ssr] ${item.id} ${html.length} chars · 双渲一致 · ${item.markers.length}/${item.markers.length} markers` +
        (item.counts?.length ? ` · ${item.counts.length}/${item.counts.length} counts` : ''),
    );
  }
} finally {
  console.warn = originalWarn;
  console.error = originalError;
  await server.close();
}

if (warnings.length > 0) {
  errors.push(`渲染期出现 ${warnings.length} 条 console warning/error`);
  for (const line of warnings) originalWarn.call(console, `  CONSOLE ${line}`);
}

if (errors.length > 0) {
  originalError(`[spikes:ssr] FAILED (${errors.length}):`);
  for (const line of errors) originalError(`  - ${line}`);
  process.exit(1);
}
originalWarn.call(
  console,
  `[spikes:ssr] PASS: ${cases.length} 个入口 SSR 单档渲染零报错（双渲确定性 + data-* 契约 + 0 warning）`,
);
