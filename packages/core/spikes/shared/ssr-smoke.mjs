/**
 * SSR 冒烟 runner（Phase 0 的 S-02 / S-04 / S-05 / S-06 + M2 的 T2-01~T2-10）。
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
