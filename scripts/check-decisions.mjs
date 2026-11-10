/**
 * T0-04 / L1~L3 决策检查点门禁：把「14 项 Phase 0 决策」与「4 条历史例外收口」
 * 变成机器可验、且不能靠文档里随口一句蒙混过去的东西。
 *
 * 判据（唯一判据来源 docs/07 §6，唯一裁决真源 scripts/phase0-decisions.json）：
 *   1. 冻结规范对齐：从 docs/07 §6 解析 14 条 checkbox 原文，与真源 specText 逐字比对；
 *      规范被改、条目被删、顺序被打乱、条目被偷偷换成都红灯。
 *   2. 裁决完整性：verdict 只能是 pass / partial / fail；pass 必须有实证；
 *      partial / fail 必须同时有替代方案与决策记录，且两者不得互相复制。
 *   3. 防虚勾 + 确认边界：docs/08 的 T0-04 状态必须与 gate.checked 一致；
 *      decisionStatus=confirmed 必须 approved + confirmedBy=Aming（禁止 AI 自批），
 *      且「确认裁决」不等于「授权勾主行 / 改依赖列」。主行勾 [x] 时还必须
 *      全部 Spike 已 [x]；依赖列写「全部」的文字依赖（T0-04 / T1-13）也在此兜底，
 *      因为 check:todo 的 L3 只解析显式任务 ID，抓不到「全部」二字。
 *      confirmedOption=A（2026-11-10 Aming 选择）时额外锁死：T0-04 依赖列保持
 *      「全部 Spike」、T0-04 / T1-13 均 [ ]、例外 0/0 —— 方案 B/C 未授权不得越界。
 *   4. 例外收口：§18.2 登记的 4 条历史例外必须逐条有裁决；已收口（resolved）的
 *      例外不得继续留在 todo-governance.json（僵尸例外），且其上游 Spike 必须已 [x]；
 *      仍待确认（pending-approval）的例外必须真实存在、上游仍 [ ]。
 *      方案 A 确认后 4 条均为 resolved，例外清单为空。
 *   5. 落地记录：docs/08 必须有 §30 且写明允许写入路径与 14 项裁决，防止只改真源不留证据。
 *
 * 注意：这里不判断「技术是否真的可行」（那是 verify 的 25 个阶段与各 smoke 的事），
 * 只判断「裁决有没有逐条对齐规范、有没有证据、有没有替未做的活打勾」。
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');
const errors = [];
const fail = (message) => errors.push(message);
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const short = (value) => (typeof value === 'string' ? value.slice(0, 40) : String(value));

const decisions = JSON.parse(read('scripts/phase0-decisions.json'));
const governance = JSON.parse(read('scripts/todo-governance.json'));
const spec = read('docs/07-决策与风险.md');
const todoText = read('docs/08-实施Todo.md');
const todoLines = todoText.split('\n');

// 1. 冻结规范对齐
const section = spec.split(/^## 6\. Phase 0 决策检查点/m)[1]?.split(/^## /m)[0] ?? '';
const specItems = [...section.matchAll(/^- \[ \] (.+)$/gm)].map((match) => (match[1] ?? '').trim());
if (specItems.length !== 14) {
  fail(`docs/07 §6 解析到 ${specItems.length} 条 checkbox（应为 14 条）`);
}
const items = decisions.items ?? [];
if (items.length !== 14) {
  fail(`裁决真源只有 ${items.length} 项（应为 14 项）`);
}
const ids = new Set();
for (const [index, item] of items.entries()) {
  const expectedId = `C${String(index + 1).padStart(2, '0')}`;
  if (item.id !== expectedId) fail(`第 ${index + 1} 项 id 应为 ${expectedId}，实际 ${item.id}`);
  if (ids.has(item.id)) fail(`裁决 id 重复：${item.id}`);
  ids.add(item.id);
  if (item.specText !== specItems[index]) {
    fail(
      `${expectedId} 的 specText 与 docs/07 §6 第 ${index + 1} 条不一致：真源「${short(item.specText)}」/ 规范「${short(specItems[index])}」`,
    );
  }
}

// 2. 裁决完整性
const verdicts = { pass: 0, partial: 0, fail: 0 };
for (const item of items) {
  if (!Object.hasOwn(verdicts, item.verdict)) {
    fail(`${item.id} 的 verdict 非法："${item.verdict}"`);
    continue;
  }
  verdicts[item.verdict] += 1;
  const evidence = item.evidence ?? [];
  if (
    !Array.isArray(evidence) ||
    evidence.length === 0 ||
    evidence.some((line) => !nonEmpty(line))
  ) {
    fail(`${item.id} 缺少实证条目`);
  }
  if (item.verdict !== 'pass') {
    if (!nonEmpty(item.alternative) || item.alternative.trim().length < 20) {
      fail(`${item.id} 是 ${item.verdict}，但缺少有效替代方案`);
    }
    if (!nonEmpty(item.decision) || item.decision.trim().length < 20) {
      fail(`${item.id} 是 ${item.verdict}，但缺少有效决策记录`);
    }
    if (item.alternative === item.decision) {
      fail(`${item.id} 的替代方案与决策记录完全相同（复制粘贴不算决策）`);
    }
  }
}
if (!nonEmpty(decisions.scopeDecision?.fact) || !nonEmpty(decisions.scopeDecision?.proposal)) {
  fail('缺少 Phase 0 / Phase 1 既成偏差的范围收窄提案（scopeDecision）');
}

// 3. 防虚勾：T0-04 状态与真源双向咬合
const stateOf = (id) => {
  const row = todoLines.find((line) => line.startsWith(`| ${id} |`));
  if (!row) return null;
  const cells = row
    .trim()
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
  return cells.at(-1) ?? null;
};
const gate = decisions.gate ?? {};
if (gate.taskId !== 'T0-04') fail('gate.taskId 必须是 T0-04');
const t004 = stateOf('T0-04');
if (t004 !== '[x]' && t004 !== '[ ]') fail(`无法解析 docs/08 的 T0-04 状态：${t004}`);
if ((t004 === '[x]') !== (gate.checked === true)) {
  fail(`T0-04 状态与 gate.checked 不一致：清单 ${t004} / 真源 ${gate.checked}`);
}
if (gate.decisionStatus === 'confirmed') {
  if (!nonEmpty(gate.confirmedBy) || !nonEmpty(gate.confirmedAt)) {
    fail('decisionStatus=confirmed 必须写明 confirmedBy / confirmedAt（禁止 AI 自批）');
  }
  if (gate.confirmedBy !== 'Aming') {
    fail('decisionStatus=confirmed 的 confirmedBy 必须是 Aming（禁止 AI 自批）');
  }
  if (decisions.scopeDecision?.approval !== 'approved') {
    fail('decisionStatus=confirmed 必须同时把 scopeDecision.approval 置为 approved');
  }
  if (decisions.scopeDecision?.confirmedBy !== 'Aming') {
    fail('scopeDecision.confirmedBy 必须是 Aming（M1 范围收窄只能由 Aming 确认）');
  }
} else if (gate.decisionStatus !== 'proposed') {
  fail(`gate.decisionStatus 非法："${gate.decisionStatus}"`);
}
if (decisions.scopeDecision?.approval !== 'pending' && gate.decisionStatus === 'proposed') {
  fail('scopeDecision.approval 与 decisionStatus=proposed 不一致');
}
const spikeIds = (governance.taskIds ?? []).filter((id) => /^S-\d+$/.test(id));
const uncheckedSpikes = spikeIds.filter((id) => stateOf(id) !== '[x]');
if (t004 === '[x]') {
  if (gate.decisionStatus !== 'confirmed') {
    fail('T0-04 已勾 [x]，但裁决仍是 AI 提案（decisionStatus≠confirmed）');
  }
  if (uncheckedSpikes.length > 0) {
    fail(
      `T0-04 虚勾：依赖「全部 Spike」，仍有 ${uncheckedSpikes.length} 个未勾：${uncheckedSpikes.join(', ')}`,
    );
  }
}
if (!nonEmpty(gate.blocker) && t004 === '[ ]') {
  fail('T0-04 未勾但真源没写阻塞原因');
}

// 3b. 「全部」是文字依赖：check:todo 的 L3 只解析显式任务 ID，抓不到这类倒挂。
//     负向实证 N08 暴露了这个盲区，这里对所有依赖列写「全部 / 全部 Spike」的任务兜底，
//     T1-13（M1 Exit，依赖「全部」）也在覆盖范围内。
const allTaskIds = governance.taskIds ?? [];
const uncheckedAll = allTaskIds.filter((id) => stateOf(id) !== '[x]');
const allDepsRows = todoLines.filter(
  (line) => /^\| (?:T0|T1|S|X)-\d+ \|/.test(line) && /\| 全部(?: Spike)? \|/.test(line),
);
for (const row of allDepsRows) {
  const id = row.match(/^\| ((?:T0|T1|S|X)-\d+) \|/)?.[1] ?? '';
  if (id && stateOf(id) === '[x]' && uncheckedAll.length > 0) {
    fail(
      `${id} 依赖「全部」却已勾 [x]：仍有 ${uncheckedAll.length} 个任务未勾（文字依赖 L3 抓不到，本门禁兜底）`,
    );
  }
}

// 3c. 方案 A 的授权边界（2026-11-10 Aming 选择）：确认裁决 ≠ 改依赖列 ≠ 勾主行。
//     方案 B（重定义 T0-04 依赖列）与方案 C（补齐四个 Spike）均未授权，机器必须拦住
//     后续无人值守轮次把 A 偷换成 B 或顺手勾掉 T1-13。
if (gate.confirmedOption) {
  if (gate.decisionStatus !== 'confirmed') {
    fail('gate.confirmedOption 存在但裁决仍未确认（decisionStatus≠confirmed）');
  }
  if (gate.confirmedOption === 'A') {
    const t004Row = todoLines.find((line) => line.startsWith('| T0-04 |')) ?? '';
    if (!/\| 全部 Spike \|/.test(t004Row)) {
      fail('方案 A 未授权改 T0-04 依赖列：必须保持「全部 Spike」（方案 B 需另行授权）');
    }
    if (t004 === '[x]' || gate.checked === true) {
      fail('方案 A 下 T0-04 主行必须保持 [ ]（确认裁决不等于通过检查点）');
    }
    if (stateOf('T1-13') === '[x]') {
      fail('方案 A 下 T1-13（M1 Exit）必须保持 [ ]');
    }
    const liveCount = (governance.exceptions ?? []).length;
    if (liveCount !== 0 || governance.maxExceptions !== 0) {
      fail(
        `方案 A 要求例外清零：exceptions=${liveCount} / maxExceptions=${governance.maxExceptions}（应为 0 / 0，只减不增）`,
      );
    }
    if (decisions.scopeDecision?.selectedOption !== 'A') {
      fail('scopeDecision.selectedOption 与 gate.confirmedOption 不一致');
    }
  }
}

// 4. 例外收口（§18.2 登记的 4 条历史倒挂，key 固定，防止真源少写一条）
const originalKeys = ['S-10<-S-08', 'T1-01<-S-03', 'T1-06<-S-07', 'T1-07<-S-09'];
const closures = decisions.exceptionClosures ?? [];
const closureByKey = new Map(closures.map((entry) => [entry.key, entry]));
for (const key of originalKeys) {
  const entry = closureByKey.get(key);
  if (!entry) {
    fail(`历史例外 ${key} 没有裁决收口条目`);
    continue;
  }
  if (!nonEmpty(entry.resolution) || !nonEmpty(entry.followUp)) {
    fail(`${key} 缺少收口结论或后续动作`);
  }
  const refs = entry.refs ?? [];
  if (!Array.isArray(refs) || refs.length === 0 || refs.some((ref) => !ids.has(ref))) {
    fail(`${key} 的 refs 为空或指向不存在的裁决编号`);
  }
  if (entry.status !== 'resolved' && entry.status !== 'pending-approval') {
    fail(`${key} 的 status 非法："${entry.status}"`);
  }
  if (!nonEmpty(entry.upstream) || !spikeIds.includes(entry.upstream)) {
    fail(`${key} 的 upstream 不是真实 Spike ID`);
  }
}
const liveKeys = new Set(
  (governance.exceptions ?? []).map((item) => `${item.task}<-${item.missingDep}`),
);
for (const key of originalKeys) {
  const entry = closureByKey.get(key);
  if (!entry) continue;
  const stillLive = liveKeys.has(key);
  if (entry.status === 'resolved') {
    if (stillLive) fail(`${key} 已裁决收口，但 todo-governance.json 里仍留着这条僵尸例外`);
    if (stateOf(entry.upstream) !== '[x]') {
      fail(`${key} 判 resolved，但上游 ${entry.upstream} 仍未勾（收口不实）`);
    }
  } else if (!stillLive) {
    fail(`${key} 仍是 pending-approval，但例外清单里已经找不到它`);
  } else if (stateOf(entry.upstream) === '[x]') {
    fail(`${key} 的上游 ${entry.upstream} 已勾，例外应删除并改为 resolved`);
  }
}
for (const key of liveKeys) {
  if (!originalKeys.includes(key)) fail(`新增例外 ${key}：例外只减不增，且必须先有裁决收口`);
}

// 5. 落地记录不可省
const hasSection30 = todoLines.some((line) => line.startsWith('## 30. '));
const section30 = todoText.split(/^## 30\. /m)[1] ?? '';
if (!hasSection30) fail('docs/08 缺少 §30 落地记录');
if (!section30.includes('允许写入路径')) fail('§30 缺少「允许写入路径」');
// 逐行解析裁决表，不能用 includes('C14')：负向实证 N15 证明落地记录里
// 一句「删 C14 表格行」的叙述文字就能把删掉的表格行冒充回来（假 PASS）。
const verdictRows = [...section30.matchAll(/^\| (C\d{2}) \|/gm)].map((match) => match[1]);
const expectedVerdictRows = items.map((item) => item.id);
if (
  verdictRows.length !== expectedVerdictRows.length ||
  verdictRows.some((id, index) => id !== expectedVerdictRows[index])
) {
  fail(
    `§30 的 14 项裁决表不完整或顺序不对：实际 ${verdictRows.length} 行（${verdictRows.join(', ')}）`,
  );
}
if (!section30.includes('S-08')) fail('§30 未写出 S-08 例外收口证据');

if (errors.length > 0) {
  console.error(`[check:decisions] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `[check:decisions] docs/07 §6 14 项逐字对齐 · 裁决 pass ${verdicts.pass} / partial ${verdicts.partial} / fail ${verdicts.fail}（未通过项均有替代方案 + 决策记录）· decisionStatus=${gate.decisionStatus}（confirmedBy=${gate.confirmedBy ?? '—'}）· 方案 ${gate.confirmedOption ?? '未选'} 授权边界在位 · T0-04 ${t004} 且 ${uncheckedSpikes.length} 个 Spike 未勾时禁止虚勾 · 4 条历史例外 ${closures.filter((entry) => entry.status === 'resolved').length} 条已消解 / ${liveKeys.size} 条仍挂账 · §30 / §30.7 派发边界在位`,
);
