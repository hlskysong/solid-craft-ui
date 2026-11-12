/**
 * 把 compare.json（判定真源）渲染成 compare.md（人读台帐）。
 * 用法：node reference/design-baseline/report.mjs
 *
 * 单独真源的理由：判定带理由、需要人来写；表格排版是纯机械转换，
 * 手抄两份必然漂移，所以只让机器做后半段。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = import.meta.dirname;
const data = JSON.parse(readFileSync(join(root, 'compare.json'), 'utf8'));

const LABELS = {
  consistent: { icon: '✅', text: '一致', hint: '与至少两家上游相同，无需动作' },
  deliberate: { icon: '⚠️', text: '刻意偏离', hint: '有依据的偏离，但理由必须落到规范正文' },
  undecided: { icon: '❗', text: '待裁决', hint: '没有依据的偏离，建议对齐上游' },
  gap: { icon: '🕳', text: '能力缺口', hint: '上游有、我们缺，落地相关组件前必须补' },
  pending: { icon: '📌', text: '待落地锚定', hint: '组件未实现，先把目标值记录下来' },
};

const order = ['undecided', 'gap', 'deliberate', 'pending', 'consistent'];
const counts = Object.fromEntries(order.map((key) => [key, 0]));
for (const row of data.verdicts) counts[row.verdict] += 1;

const escapeCell = (value) => String(value).replaceAll('|', '\\|');
const table = (rows, withNote) => {
  const header = withNote
    ? '| 维度 | 本仓（scui） | Ant Design | TDesign | Semi | 出处 |\n| --- | --- | --- | --- | --- | --- |'
    : '| 维度 | 本仓（scui） | Ant Design | TDesign | Semi |\n| --- | --- | --- | --- | --- |';
  const body = rows.map((row) => {
    const cells = [row.dimension, row.scui, row.antd, row.tdesign, row.semi].map(escapeCell);
    return withNote
      ? `| ${cells.join(' | ')} | \`${escapeCell(row.source)}\` |`
      : `| ${cells.join(' | ')} |`;
  });
  return [header, ...body].join('\n');
};

const sections = order
  .filter((key) => counts[key] > 0)
  .map((key) => {
    const { icon, text, hint } = LABELS[key];
    const rows = data.verdicts.filter((row) => row.verdict === key);
    const notes = rows.map((row) => `- **${row.dimension}** — ${row.note}`).join('\n');
    return `### ${icon} ${text}（${counts[key]} 项）\n\n> ${hint}\n\n${table(rows, true)}\n\n${notes}`;
  })
  .join('\n\n');

const summary = order
  .filter((key) => counts[key] > 0)
  .map((key) => `| ${LABELS[key].icon} ${LABELS[key].text} | ${counts[key]} |`)
  .join('\n');

const pinned = Object.entries(data.upstream.pinned)
  .map(([name, version]) => `| ${name} | ${version} |`)
  .join('\n');

const markdown = `# 设计基线对照台帐

> ${data.version} · ${data.updatedAt} · 由 \`report.mjs\` 从 \`compare.json\` 生成，**不要手改本文件**。
>
> 目的：把 docs/03 §1「参考 TDesign / Ant Design / Semi Design」这句无法核验的话，换成一张有数值、有出处、有判定理由的表。
> 判据不是「像不像」，而是「同不同 + 是否有理由」。

## 1. 上游版本锁定

| 库 | 锁定版本 |
| --- | --- |
${pinned}

${data.upstream.caveat}

数值抽取自 \`${data.upstream.raw}\`，由 \`refresh.mjs\` 从上游包内源文件解析，出处见各行「出处」列与 raw 文件的 \`source\` 字段。

## 2. 结论摘要

| 判定 | 项数 |
| --- | --- |
${summary}

读法：**待裁决**要先动，**能力缺口**按组件排期动，**刻意偏离**只需补理由，**一致**项不用管。

## 3. 逐项对照

${sections}

## 4. 复现方式

\`\`\`sh
# shell: sh
node reference/design-baseline/fetch-upstream.mjs   # 下载并解包上游包到 .cache/（已 gitignore）
node reference/design-baseline/refresh.mjs          # 重新抽取 raw/upstream-values.json
node reference/design-baseline/report.mjs           # 由 compare.json 重渲染本文件
\`\`\`

上游升级后重跑这三步，diff \`raw/upstream-values.json\` 就知道哪些数值变了；\`compare.json\` 里的判定不会自动跟着变，需要人重新裁决 —— 这是刻意的。

## 5. 边界

- 本目录**不参与** \`pnpm verify\`：它是参考资料，不是产物，也不该在 CI 里联网。
- \`docs/01~07\` 是 SHA256 冻结基线，本批次**未改其一字节**；需要落到规范正文的结论以「待人工确认的改动建议」形式提交，由 Aming 决定是否 \`check:goals --update-baseline\`。
- 只比数值与结构，不复制上游视觉资产（三家均 MIT，但仍须保持品牌差异）。
`;

writeFileSync(join(root, 'compare.md'), markdown, 'utf8');
console.log(`[design-baseline] 已渲染 compare.md（${data.verdicts.length} 项）`);
