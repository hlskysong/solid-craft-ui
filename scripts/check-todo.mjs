/**
 * T1-16 / L2~L5 清单治理：AI 自主跑任务流时，勾选项、依赖顺序、上下文目标都不能靠自觉。
 *
 * 判据（唯一清单为 docs/08-实施Todo.md，契约在 scripts/todo-governance.json）：
 *   1. 结构：§0~§4 的任务 ID 集合与契约一致（不可删任务 / 不可删验收列 / 必备章节齐全）。
 *   2. L2 勾选需证据：每个 [x] 必须在受哈希保护的 todo-governance.json#evidence 里登记
 *      「由哪一节验收输出证明」，且该小节真实存在、标题含验收类关键词、正文点名该任务。
 *      不采用「全文搜到 ID 就算有证据」——负向实证证明那样会被文档里随口一句
 *      （例如负向实证表格提到 S-02）伪造出证据。注册表里给未勾选任务预置条目同样红灯。
 *   3. L3 依赖倒挂：X=[x] 而依赖 Y=[ ] ⇒ 红灯。历史欠账只能在受保护的例外清单里显式登记，
 *      且每条必须当前仍是真实倒挂、带原因与到期条件；例外只减不增，上游补齐后未删除即报
 *      「僵尸例外」，避免例外变成永久免责。
 *   4. L5 上下文锚点：08 顶部的「当前锚点」五个字段必须齐全且非空；
 *      「当前任务 ID」必须是真实存在的任务 ID。
 *   5. L4 派发边界：最新一轮落地记录必须写明「允许写入路径」，并含可复制的全链验收证据
 *      （pnpm verify + RC=0），不采信自报完成。
 *
 * 08 本身不做 SHA256 冻结（它是每轮要增量更新的清单），只做结构校验；
 * 目标冻结与门禁自身完整性由 scripts/check-goals.mjs 负责。
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const todoText = readFileSync(join(repoRoot, 'docs', '08-实施Todo.md'), 'utf8');
const governance = JSON.parse(
  readFileSync(join(repoRoot, 'scripts', 'todo-governance.json'), 'utf8'),
);
const lines = todoText.split('\n');
const errors = [];
const fail = (message) => errors.push(message);
const taskIdRe = /^(?:T0|T1|T2|S|X)-\d+$/;
// 显式比较器：oxlint type-aware 要求 sort 类调用带 compare，且避免 locale 差异
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// 1. 结构校验：只解析 §0~§4，避免落地记录里的表格被误当成任务行
const coreStart = lines.findIndex((line) => line.startsWith('## 0. '));
const coreEnd = lines.findIndex((line) => line.startsWith('## 5. '));
if (coreStart < 0 || coreEnd < 0 || coreEnd <= coreStart) {
  fail('无法定位 docs/08 的 §0~§4 结构');
}
const core = coreStart >= 0 && coreEnd > coreStart ? lines.slice(coreStart, coreEnd) : [];
const tasks = new Map();
for (const [index, line] of core.entries()) {
  if (!line.startsWith('|')) continue;
  const cells = line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
  const id = cells[0] ?? '';
  if (!taskIdRe.test(id)) continue;
  const isCross = id.startsWith('X-');
  const state = cells.at(-1);
  if (state !== '[x]' && state !== '[ ]') fail(`${id} 的状态列非法："${state}"`);
  // §3 横切检查表只有 4 列（ID / 检查项 / 依据 / 状态），没有依赖列与验收列，
  // 按 6 列任务表去卡会误报；其余表格的验收描述统一在第 5 列（index 4）。
  const minCells = isCross ? 4 : 6;
  if (cells.length < minCells) fail(`${id} 的表格列数不足（可能被删列）`);
  const acceptance = isCross ? (cells[1] ?? '') : (cells[4] ?? '');
  if (acceptance.length === 0) fail(`${id} 的验收 / 检查项被删空`);
  tasks.set(id, { state, deps: isCross ? '' : (cells[2] ?? ''), line: coreStart + index + 1 });
}
const expectedIds = [...(governance.taskIds ?? [])].toSorted(compare);
const actualIds = [...tasks.keys()].toSorted(compare);
if (expectedIds.length === 0) fail('todo-governance.json 缺少 taskIds');
if (actualIds.length !== expectedIds.length || actualIds.some((id, i) => id !== expectedIds[i])) {
  fail(
    `任务 ID 集合与契约不一致：期望 ${expectedIds.length} 个，实际 ${actualIds.length} 个（禁止删任务或批量新增）`,
  );
}
for (const heading of governance.requiredHeadings ?? []) {
  if (!todoText.includes(heading)) fail(`docs/08 缺少必备章节：${heading}`);
}

// 2. 验收输出区块：§8 起、### N.N 小节、标题含验收类关键词
const evidenceKeyword = /验收|实测|结果|实证|完成|状态/;
const blocks = [];
let current = null;
let inRecords = false;
for (const [index, line] of lines.entries()) {
  const section = line.match(/^## (\d+)\. /);
  if (section) {
    inRecords = Number(section[1]) >= 8;
    current = null;
    continue;
  }
  if (!inRecords) continue;
  if (/^### \d+\.\d+ /.test(line)) {
    current = evidenceKeyword.test(line) ? { title: line, line: index + 1, text: [] } : null;
    if (current) blocks.push(current);
  } else if (/^#{1,3} /.test(line)) {
    current = null;
  } else if (current) {
    current.text.push(line);
  }
}
const evidenceMap = governance.evidence ?? {};
const blockByNum = new Map(
  blocks.map((block) => [block.title.match(/^### (\d+\.\d+) /)?.[1], block]),
);
for (const [id, info] of tasks) {
  if (info.state !== '[x]') continue;
  const num = evidenceMap[id];
  if (!num) {
    fail(`${id} 已勾选 [x] 但证据注册表无条目（L2：勾了没干活，不得靠文档里提及 ID 充当证据）`);
    continue;
  }
  const block = blockByNum.get(num);
  if (!block) {
    fail(`${id} 的证据区块 §${num} 不存在或不是验收输出区块`);
    continue;
  }
  if (!new RegExp(`\\b${id}\\b`).test(block.text.join('\n'))) {
    fail(`${id} 的证据区块 §${num} 正文未点名该任务（证据指向不实）`);
  }
}
for (const id of Object.keys(evidenceMap)) {
  if (tasks.get(id)?.state !== '[x]') {
    fail(`证据注册表给未勾选任务 ${id} 预置了条目（禁止先铺证据再批量勾选）`);
  }
}

// 3. L3 依赖倒挂 + 例外清单
const exceptions = governance.exceptions ?? [];
if (exceptions.length > governance.maxExceptions) {
  fail(`例外 ${exceptions.length} 条，超过契约上限 ${governance.maxExceptions} 条（例外只减不增）`);
}
const known = new Set();
const actualInversions = [];
for (const [id, info] of tasks) {
  if (info.state !== '[x]') continue;
  for (const dep of info.deps.matchAll(/\b(?:T0|T1|S|X)-\d+\b/g)) {
    const depId = dep[0];
    if (tasks.get(depId)?.state === '[ ]') actualInversions.push({ task: id, missingDep: depId });
  }
}
const inversionKey = (pair) => `${pair.task}<-${pair.missingDep}`;
const actualKeys = new Set(actualInversions.map(inversionKey));
for (const item of exceptions) {
  const key = inversionKey(item);
  if (known.has(key)) fail(`例外重复登记：${key}`);
  known.add(key);
  if (!actualKeys.has(key)) {
    fail(`僵尸例外 ${key}：当前已不是依赖倒挂，必须从例外清单删除（例外不能变永久免责）`);
  }
  if (!item.reason || !item.registeredAt || !item.resolveBy) {
    fail(`例外 ${key} 缺少原因 / 登记日期 / 到期条件`);
  }
}
for (const pair of actualInversions) {
  if (!known.has(inversionKey(pair))) {
    fail(
      `新增依赖倒挂 ${inversionKey(pair)}：${pair.task} 已 [x]，上游 ${pair.missingDep} 仍 [ ]（须先补上游或显式登记例外）`,
    );
  }
}

// 4. L5 上下文锚点
const anchorStart = lines.findIndex((line) => line.startsWith('## 当前锚点'));
if (anchorStart < 0) {
  fail('docs/08 顶部缺少「## 当前锚点」小节（L5：上下文压缩后目标会丢）');
} else {
  const nextSection = lines.findIndex(
    (line, index) => index > anchorStart && /^## \d+\. /.test(line),
  );
  const anchor = lines.slice(anchorStart, nextSection < 0 ? undefined : nextSection).join('\n');
  for (const field of governance.anchorFields ?? []) {
    const row = anchor.split('\n').find((line) => line.startsWith(`| ${field} |`));
    if (!row) {
      fail(`当前锚点缺少字段「${field}」`);
      continue;
    }
    if ((row.split('|')[2] ?? '').trim().length === 0) fail(`当前锚点字段「${field}」为空`);
  }
  const taskField = anchor.split('\n').find((line) => line.startsWith('| 当前任务 ID |')) ?? '';
  if (![...tasks.keys()].some((id) => new RegExp(`\\b${id}\\b`).test(taskField))) {
    fail('当前锚点的「当前任务 ID」不是真实任务 ID');
  }
}

// 5. L4 派发边界：最新落地记录必须有写入范围 + 机器验收证据
const recordLines = lines.filter((line) => /^## (\d+)\. /.test(line));
const lastRecord = recordLines.at(-1) ?? '';
const lastNumber = Number(lastRecord.match(/^## (\d+)\. /)?.[1] ?? 0);
const lastStart = lines.findIndex((line) => line.startsWith(lastRecord));
const lastBody = lastStart < 0 ? '' : lines.slice(lastStart).join('\n');
if (lastNumber < 8) {
  fail('找不到 §8 之后的落地记录');
} else {
  if (!lastBody.includes('允许写入路径')) {
    fail(`最新落地记录（§${lastNumber}）未写「允许写入路径」（L4：派发边界不可省）`);
  }
  if (!lastBody.includes('pnpm verify') || !lastBody.includes('RC=0')) {
    fail(`最新落地记录（§${lastNumber}）缺少 pnpm verify RC=0 证据（不采信自报完成）`);
  }
}

if (errors.length > 0) {
  console.error(`[check:todo] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
const done = [...tasks.values()].filter((info) => info.state === '[x]').length;
console.log(
  `[check:todo] ${tasks.size} 个任务结构完整 · ${done} 个 [x] 全部有验收证据 · ${blocks.length} 个验收区块 · 倒挂 ${actualInversions.length} 处（例外 ${exceptions.length}/${governance.maxExceptions} 条均有效且有到期条件） · 当前锚点 5 字段齐全 · §${lastNumber} 派发边界与全链证据在位`,
);
