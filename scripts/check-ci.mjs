/**
 * T1-07 CI 契约门禁：让「CI 全绿」变成机器可验的契约，而不是靠人记住该跑哪些命令。
 *
 * 平台无关部分全部落在这个脚本里；切换 CI 平台只需替换 .github/workflows/ci.yml。
 * 判据：
 *   1. 根 verify 脚本阶段齐全（06 §1.3 / §13.1 的 lint/typecheck/unit/build/size/
 *      publint/attw/Playwright + 本仓库已有的 check:* 与 4 个 smoke，含 T1-12 的
 *      check:slice / check:decisions），且 build 必须排在 size / check:styles / check:release /
 *      check:naming / check:ci / check:slice 之前（六者都读 dist 产物）。
 *   2. .size-limit.json 每条的名称与预算值逐字对齐 docs/02 §4.6（唯一真源）；
 *      规范里产物尚未实现的预算行只报告、不伪造配置。
 *   3. 每条 path glob 至少命中一个真实的 dist 文件 —— 防止 size-limit 空匹配
 *      算成 0 字节而「假 PASS」。
 *   4. CI workflow 契约：--frozen-lockfile、pnpm verify、各架构 tsc --version、
 *      node-version-file、多架构 matrix、与截图基线同平台；ci.yml 不含发布凭据或直发命令。
 *      2026-11-11 起加用量红线（§30.17，Aming 提出「过量跑 Actions 有封号风险」）：
 *      每次 push 真正运行的 job 数 ≤ 1、跨架构矩阵必须被 workflow_dispatch gate 住、
 *      不接 pull_request、必须有 concurrency cancel-in-progress 与 per-job timeout-minutes。
 *      计数式判据（数 job）而不是白名单式判据（只认 job 名），新增 job 必须显式 gate。
 *   5. 工具链单点：size 脚本必须走 size-limit，且 @size-limit/file 插件已声明。
 *   6. T1-11 受控发布通道：扫描 .github/workflows/ 下全部 yml（只扫 ci.yml 会留绕过盲区），
 *      凭据字面量与直发命令零容忍；release.yml 必须手动触发 + environment 审批 +
 *      id-token: write + 指向 pnpm stage:release，禁止 push 触发与非官方 registry。
 *   7. 视觉基线防漂移（2026-11-10 §30.8）：CI 必须安装 bundled chromium，
 *      playwright.config.ts 默认不得回退系统 Chrome、不得放宽 maxDiffPixelRatio，
 *      channel:'chrome' 只能作为本地排查的条件分支存在；ci.yml 安装 chromium 必须
 *      带 --no-shell（new headless 不需要 headless-shell）。
 *   8. 视觉基线字体契约（2026-11-10 §30.9 方案 B）：Demo 宿主必须用仓库内固定
 *      Web 字体（哈希锁定 + 字集与 apps/docs/src 源码逐字一致 + OFL 许可证在位），
 *      禁止写回任何系统字体回退，杜绝 runner 字体集再次参与像素比对。
 *      字体判据放在本脚本而非新脚本，是为了当时不改 verify 阶段数量、不触碰根级
 *      package.json / pnpm-lock.yaml（AGENTS.md §5）；2026-11-11 起 R3 门禁已作为
 *      独立阶段 `check:accessors` 加入，verify 现为 26 阶段。
 *   9. Phase 0 Spike 契约（2026-11-10 §30.10 方案 C）：四个 Spike 的目录 / 客户端实证 /
 *      SSR 入口 / 统一模板 API 草案必须在位，spikes/ 不得渗入发布包（files / exports /
 *      src），且 ssr-smoke.mjs 必须真实跑绿。客户端实证由 vitest include 自动接进
 *      pnpm test（verify 第 2 阶段），此处只校验配置未被摘掉。
 *  10. R3 访问器契约门禁（2026-11-11 §30.14）：`check:accessors` 必须在 verify 里（判据
 *      本身在 scripts/check-accessors.mjs）。摘掉即让 `MaybeAccessor` 的函数型实参失去
 *      机器兜底 —— 那是运行时 `typeof === 'function'` 区分值与 getter 的唯一前提。
 *  11. M2 Exit 覆盖契约（2026-11-12 §30.31）：① 除 overview（聚合页，不是组件）外，
 *      每个组件至少 3 个 Demo（docs/04 §3.3 的 P0 验收原文）；② 视觉基线文件集合必须
 *      与「(slug, demo) × viewport」逐一对齐 —— 少一张说明新增 Demo 没进截图，多一张
 *      说明 Demo 删了基线没清，两种都会让「视觉回归」变成部分覆盖；③ 截图 / axe 用例
 *      必须按 DEMO_CASES 循环并断言 data-demo-name，否则宿主回落到首 Demo 时
 *      「截图成功但截错页面」不会被发现。
 *  12. T3-14 M3 Exit 体积实算（2026-11-15 §30.48）：docs/02 §4.6 的
 *      「Table + Virtual ≤ 35 KB」含 Phase 5 才交付的虚拟滚动，本阶段不把该行
 *      塞进 .size-limit.json（判据 2 的「只报告、不伪造配置」），改用与
 *      @size-limit/file 同口径的逐文件 gzipSync 实算 Table 基础链路并对比 35 KB；
 *      同时钉住未实现预算的显式声明、判据 11 扩面后仍成立、M3 里程碑散文记录。
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const repoRoot = resolve(import.meta.dirname, '..');
const errors = [];
const read = (abs) => (existsSync(abs) ? readFileSync(abs, 'utf8') : '');
const fail = (message) => errors.push(message);
const toKb = (value, unit) => (unit.toUpperCase() === 'MB' ? value * 1024 : value);

const rootPkg = JSON.parse(read(join(repoRoot, 'package.json')));
const sizeConfigPath = join(repoRoot, '.size-limit.json');
const workflowsDir = join(repoRoot, '.github', 'workflows');
const workflowPath = join(workflowsDir, 'ci.yml');

// 1. verify 阶段契约
const verify = rootPkg.scripts?.verify ?? '';
const stages = [...verify.matchAll(/pnpm\s+([\w:.-]+)/g)].map((match) => match[1] ?? '');
const requiredStages = [
  'build',
  'test',
  'test:e2e',
  'typecheck',
  'lint',
  'check:docs',
  'check:llms',
  'check:styles',
  'check:accessors',
  'check:release',
  'check:naming',
  'check:public',
  'check:goals',
  'check:todo',
  'check:decisions',
  'check:platforms',
  'size',
  'check:ci',
  'check:exports',
  'check:slice',
  'publint',
  'attw',
  'smoke:consumers',
  'smoke:tarball',
  'smoke:ssr',
  'smoke:start-real',
];
for (const stage of requiredStages) {
  if (!stages.includes(stage)) fail(`verify 缺少必需阶段 pnpm ${stage}`);
}
const buildAt = stages.indexOf('build');
for (const stage of [
  'size',
  'check:styles',
  'check:release',
  'check:naming',
  'check:ci',
  'check:slice',
]) {
  if (buildAt >= 0 && stages.indexOf(stage) >= 0 && stages.indexOf(stage) < buildAt) {
    fail(`pnpm ${stage} 依赖 dist 产物，必须排在 pnpm build 之后`);
  }
}

// 2. 体积预算与 docs/02 §4.6 同源
const archDoc = read(join(repoRoot, 'docs', '02-架构设计.md'));
const budgetSection = archDoc.split('### 4.6 产物体积预算')[1]?.split('\n---')[0] ?? '';
const budgets = new Map();
for (const line of budgetSection.split('\n')) {
  const match = line.match(/^\|\s*([^|]+?)\s*\|\s*≤\s*([\d.]+)\s*(KB|MB)\s*\|/);
  if (match?.[1] && match[2] && match[3]) {
    budgets.set(match[1].trim(), toKb(Number(match[2]), match[3]));
  }
}
if (budgets.size === 0) fail('无法从 docs/02 §4.6 解析体积预算表（标题或表格格式变化）');

const checks = existsSync(sizeConfigPath) ? JSON.parse(read(sizeConfigPath)) : [];
if (!Array.isArray(checks) || checks.length === 0) {
  fail('.size-limit.json 缺失或为空');
}
const covered = new Set();
for (const check of checks) {
  const expected = budgets.get(check.name);
  if (expected === undefined) {
    fail(`.size-limit.json 条目 "${check.name}" 不在 docs/02 §4.6 预算表内`);
    continue;
  }
  covered.add(check.name);
  const limitMatch = String(check.limit ?? '').match(/^([\d.]+)\s*(KB|MB)$/i);
  if (!limitMatch?.[1] || !limitMatch[2]) {
    fail(`${check.name} 的 limit 格式非法："${check.limit}"`);
    continue;
  }
  const actual = toKb(Number(limitMatch[1]), limitMatch[2]);
  if (actual !== expected) {
    fail(`${check.name} 预算 ${actual} KB 与 docs/02 §4.6 的 ${expected} KB 不一致`);
  }
  if (check.gzip !== true) fail(`${check.name} 未显式开启 gzip（02 §4.6 预算口径是 gzip）`);

  // 3. path 必须命中真实 dist 文件，避免空匹配假 PASS
  const patterns = Array.isArray(check.path) ? check.path : [check.path];
  const files = patterns.flatMap((pattern) =>
    typeof pattern === 'string' ? globSync(pattern, { cwd: repoRoot }) : [],
  );
  if (files.length === 0)
    fail(`${check.name} 的 path 未匹配到任何产物文件（size-limit 会算成 0 字节）`);
  const outsideDist = files.filter((file) => !file.includes('/dist/'));
  if (outsideDist.length > 0) {
    fail(`${check.name} 的 path 含非 dist 文件：${outsideDist.slice(0, 3).join(', ')}`);
  }
}

// 3.5 发布产物不带源码注释（T2-12，docs/08 §30.30）
// 体积预算能不能达标，取决于 build 链里有没有跑 scripts/strip-dist-comments.mjs。
// 这里把「结果」钉住：dist 里只允许指令类注释（/*#__PURE__*/ 之类、/*! legal */、
// //# sourceMappingURL=），源码 JSDoc 一律不许进产物 —— 它们已经有一份在 dist/types 里。
const distArtifacts = [
  ...globSync('packages/core/dist/esm/**/*.js', { cwd: repoRoot }),
  ...globSync('packages/core/dist/styles/**/*.css', { cwd: repoRoot }),
];
if (distArtifacts.length === 0) {
  fail('未找到 dist 产物，无法校验「产物零源码注释」契约（需先 pnpm build）');
} else {
  const commentOffenders = [];
  for (const rel of distArtifacts) {
    const code = read(join(repoRoot, rel));
    const blocks = code.match(/\/\*[\s\S]*?\*\//g) ?? [];
    const strayBlocks = blocks.filter((block) => !/^\/\*[#!]|^\/\*\s*@__/.test(block));
    const strayLines = code.match(/(?:^|\n)[ \t]*\/\/(?!#)[^\n]*/g) ?? [];
    if (strayBlocks.length + strayLines.length > 0) {
      commentOffenders.push(`${rel}（块 ${strayBlocks.length} / 行 ${strayLines.length}）`);
    }
  }
  if (commentOffenders.length > 0) {
    fail(
      `发布产物含源码注释（build 链应跑 scripts/strip-dist-comments.mjs）：${commentOffenders.slice(0, 4).join('；')}`,
    );
  }
}

// 4. CI workflow 契约
const workflow = read(workflowPath);
// 用量红线的统计结果要在收尾汇总里打印，先在外层占位（判据本身在下面的 else 块里）
const ciUsage = { pushJobs: 0, totalJobs: 0 };
if (workflow.length === 0) {
  fail('缺少 .github/workflows/ci.yml');
} else {
  const requiredTokens = [
    'pnpm install --frozen-lockfile',
    'pnpm exec playwright install chromium',
    'pnpm verify',
    'pnpm exec tsc --version',
    'pnpm check:platforms',
  ];
  for (const token of requiredTokens) {
    if (!workflow.includes(token)) fail(`ci.yml 缺少 ${token}`);
  }
  if (!/pnpm exec playwright install chromium --no-shell/.test(workflow)) {
    fail(
      'ci.yml 未用 --no-shell：new headless 只需完整 build，headless-shell 是本机已证实会卡住的 99 MiB 额外依赖',
    );
  }
  if ((workflow.match(/tsc --version/g) ?? []).length < 2) {
    fail('ci.yml 的 tsc --version 少于 2 处（主门禁 job 与多架构 job 都要跑）');
  }
  if (!/node-version-file:\s*['"]?\.node-version['"]?/.test(workflow)) {
    fail('ci.yml 未通过 node-version-file 绑定 .node-version');
  }
  if (!/runs-on:\s*macos-15/.test(workflow)) {
    fail(
      'ci.yml 主门禁未使用 macos-15 runner（字形已由仓库内字体固定，但光栅化仍走 CoreText，需与基线同 macOS 大系列）',
    );
  }
  if (!workflow.includes('matrix:')) fail('ci.yml 缺少多架构 matrix');
  const osList = workflow.match(/^\s*os:\s*\[([^\]]+)\]/m)?.[1];
  if (!osList || osList.split(',').filter(Boolean).length < 3) {
    fail('ci.yml 的 matrix 架构少于 3 个（S-09 要求各架构验证平台包）');
  }
  if (/NPM_TOKEN|NODE_AUTH_TOKEN|\bnpm publish\b|changeset publish/.test(workflow)) {
    fail('ci.yml 出现发布凭据或直发命令：verify job 只负责门禁，不参与发布');
  }

  // 4a. 用量红线（§30.17）：每次 push 只允许 1 个 job 真跑，其余必须显式 gate
  if (/^ {2}pull_request:\s*$/m.test(workflow)) {
    fail('ci.yml 接了 pull_request 触发：本仓无 PR 流程，接上等于每个 PR 再跑一整套门禁');
  }
  if (!/cancel-in-progress:\s*true/.test(workflow)) {
    fail('ci.yml 缺少 concurrency.cancel-in-progress: true（连续 push 会堆并发 run）');
  }
  // gate 住的 job 必须有触发方式，否则等于把跨架构校验改成不可达的死代码
  if (!/^ {2}workflow_dispatch:/m.test(workflow)) {
    fail('ci.yml 缺少 workflow_dispatch 触发：被 gate 住的跨架构矩阵会变成永不执行的死代码');
  }
  const jobsBlock = workflow.split(/^jobs:\s*$/m)[1] ?? '';
  const jobHeads = [...jobsBlock.matchAll(/^ {2}([A-Za-z0-9_-]+):\s*$/gm)];
  if (jobHeads.length === 0) {
    fail('ci.yml 未解析到任何 job（jobs: 块结构变化会让用量判据空转）');
  }
  const jobList = jobHeads.map((head, index) => {
    const start = head.index ?? 0;
    const end = jobHeads[index + 1]?.index ?? jobsBlock.length;
    const chunk = jobsBlock.slice(start, end);
    return {
      name: head[1] ?? '',
      chunk,
      // 4 空格缩进 = job 级键；6 空格是 steps 内的键，不参与判断
      gated: /^ {4}if:/m.test(chunk),
      hasTimeout: /^ {4}timeout-minutes:/m.test(chunk),
    };
  });
  const pushJobs = jobList.filter((job) => !job.gated);
  ciUsage.pushJobs = pushJobs.length;
  ciUsage.totalJobs = jobList.length;
  if (pushJobs.length > 1) {
    fail(
      `ci.yml 有 ${pushJobs.length} 个 job 会在每次 push 时运行（用量红线 ≤ 1）：${pushJobs.map((job) => job.name).join(' / ')} —— 新增 job 必须用 if: 显式 gate`,
    );
  }
  for (const job of jobList) {
    if (!job.hasTimeout)
      fail(`ci.yml 的 job "${job.name}" 未设 timeout-minutes（卡死会烧到默认 6 小时）`);
  }
  const platformJob = jobList.find((job) => job.chunk.includes('pnpm check:platforms'));
  if (!platformJob) {
    fail('ci.yml 没有跑 pnpm check:platforms 的 job');
  } else if (!/^ {4}if:.*workflow_dispatch/m.test(platformJob.chunk)) {
    fail(
      `ci.yml 的跨架构 job "${platformJob.name}" 未按 workflow_dispatch gate：三架构矩阵不能随每次 push 跑`,
    );
  }

  // 4c. 全量 / 增量分流契约（§30.33 落地、§30.34 改为 dev/main 双分支）：
  // dev 日常增量；push main（发版合并）/ tag / 手动 / 夜间一律全量。
  const verifyMain = rootPkg.scripts?.['verify:main'] ?? '';
  if (verifyMain.length === 0) {
    fail('package.json 缺少 verify:main（§30.33 的增量门禁入口）');
  } else {
    // 阶段对齐：除 test:e2e 换成 test:e2e:affected，其余必须逐项一致。
    // 两个脚本各写一遍是刻意的（新增阶段时人必须看见两处），漂移就靠这条抓。
    const mainStages = [...verifyMain.matchAll(/pnpm\s+([\w:.-]+)/g)].map(
      (match) => match[1] ?? '',
    );
    const expected = stages.map((stage) => (stage === 'test:e2e' ? 'test:e2e:affected' : stage));
    if (mainStages.join(' && ') !== expected.join(' && ')) {
      fail(
        `verify:main 的阶段与 verify 不一致（只允许 test:e2e → test:e2e:affected）：${mainStages.join(' / ')}`,
      );
    }
  }
  if (!(rootPkg.scripts?.['test:e2e:affected'] ?? '').includes('scripts/e2e-affected.mjs')) {
    fail(
      'package.json 的 test:e2e:affected 未走 scripts/e2e-affected.mjs（作用域为空时必须能整链跳过）',
    );
  }
  if (!existsSync(join(repoRoot, 'scripts/affected.mjs'))) {
    fail('缺少 scripts/affected.mjs（§30.33 的作用域判定，含「默认全量」fail-safe）');
  }

  // ci.yml 侧的触发面：两条分支都必须监听，漏掉 main 等于发版合并完全不受门禁约束。
  for (const [pattern, message] of [
    [
      /^ {4}branches:\s*\[dev,\s*main\]/m,
      'ci.yml 的 push.branches 未同时监听 dev 与 main（§30.34 双分支策略）',
    ],
    [/^ {2}schedule:/m, 'ci.yml 缺少 schedule 触发：dev 只剩增量就失去全量兜底'],
    [/^ {4}tags:\s*\[/m, 'ci.yml 的 push 未挂 tags 触发：打 tag 发布时不会跑全量'],
    [/node scripts\/affected\.mjs --base/, 'ci.yml 未调用 scripts/affected.mjs 推断作用域'],
  ]) {
    if (!pattern.test(workflow)) fail(message);
  }

  // 两个门必须严格互补：只按 step 名取各自的 if 行，避免注释里的示例文字冒充判据。
  const stepChunk = (name) => {
    const marker = `      - name: ${name}`;
    const start = workflow.indexOf(marker);
    if (start < 0) return '';
    const end = workflow.indexOf('      - ', start + marker.length);
    return workflow.slice(start, end < 0 ? workflow.length : end);
  };
  // step 内的 if 与 `- name:` 的内容列对齐（8 空格）；job 级 if 才是 4 空格。
  const stepIf = (name) => stepChunk(name).match(/^ {8}if: (.+)$/m)?.[1] ?? '';
  const scopeIf = stepIf('推断增量 e2e 作用域');
  const incIf = stepIf('Incremental gate (pnpm verify:main)');
  const fullIf = stepIf('Full gate (pnpm verify)');
  if (incIf.length === 0 || fullIf.length === 0) {
    fail('ci.yml 缺少增量门 / 全量门的 if 条件（两个门必须显式写明）');
  } else {
    if (
      !incIf.includes("github.event_name == 'push'") ||
      !incIf.includes("github.ref == 'refs/heads/dev'")
    ) {
      fail('ci.yml 的增量门不是「push && refs/heads/dev」：不能把 main 合并也判成增量');
    }
    if (
      !fullIf.includes("github.event_name != 'push'") ||
      !fullIf.includes("github.ref != 'refs/heads/dev'")
    ) {
      fail('ci.yml 的全量门不是增量门的补集：会留下「两个门都不跑」的静默空窗');
    }
    if (scopeIf.length === 0 || scopeIf !== incIf) {
      fail('ci.yml 的作用域推断 step 与增量门条件不一致（算了不用 / 用了没算）');
    }
  }
  if (!stepChunk('Incremental gate (pnpm verify:main)').includes('run: pnpm verify:main')) {
    fail('ci.yml 的增量门未接 pnpm verify:main');
  }
  if (!stepChunk('Full gate (pnpm verify)').includes('run: pnpm verify')) {
    fail('ci.yml 的全量门未接 pnpm verify');
  }
}

// 4d. Table 引擎基座契约（§30.35，T3-01）。这三条都是「后续批次最容易悄悄退化」的点：
// T3-02~T3-06 要在同一个 TableState 上加排序 / 筛选 / 选择 / 分页，一旦有人图省事
// 在视图里直接读 props 或另建 signal，docs/04 §5.1 点名的「受控状态混用」风险就回来了。
const tableDir = join(repoRoot, 'packages', 'core', 'src', 'components', 'table');
const tableImpl = read(join(tableDir, 'Table.tsx'));
const tableStyles = read(join(tableDir, 'table.scss'));
const tableEngine = read(join(tableDir, 'table-engine.ts'));
if (tableImpl.length === 0 || tableStyles.length === 0 || tableEngine.length === 0) {
  fail('Table 引擎基座缺少 Table.tsx / table.scss / table-engine.ts（T3-01 纵向切片）');
} else {
  // 泛型调用写作 useTableEngine<T>(local)，中间带类型实参，正则要放行这一段
  if (!/useTableEngine(?:<[^>]*>)?\s*\(/.test(tableImpl)) {
    fail('Table.tsx 未调用 useTableEngine：视图不得绕开单一状态真源');
  }
  // T3-02 起状态字段变多，且视图改用 splitProps 后的 local；两条一起钉住，
  // 避免有人把排序 / 筛选状态绕开引擎直接读 props（4d-a 只挡得住「完全不调引擎」）。
  if (
    /(?:props|local)\.(columns|data|rowKey|loading|bordered|size|density|sorter|defaultSorter|filters|defaultFilters|rowSelection|pagination|onChange|server|multipleSorters)\b/.test(
      tableImpl,
    )
  ) {
    fail(
      'Table.tsx 直接读取 props / local 的状态字段（含分页配置）：状态必须由 useTableEngine 归一后消费',
    );
  }
  if (
    !/--scui-table-font-size/.test(tableStyles) ||
    (tableStyles.match(/font-size:\s*var\(--scui-table-font-size\)/g) ?? []).length < 2
  ) {
    fail('table.scss 未让表头与正文共用 --scui-table-font-size（不靠缩字号表达层级）');
  }
  if (/font-size:\s*\d/.test(tableStyles)) {
    fail('table.scss 出现 font-size 字面量：表头与正文必须共用同一档变量');
  }
}
const tableSsrEntry = join(tableDir, '__tests__', 'ssr-entry.tsx');
const ssrSmokeRunner = read(
  join(repoRoot, 'packages', 'core', 'spikes', 'shared', 'ssr-smoke.mjs'),
);
if (!existsSync(tableSsrEntry) || !ssrSmokeRunner.includes("id: 'T3-01'")) {
  fail('Table 的 SSR 入口未登记进 ssr-smoke.mjs（建了入口却没跑等于没有）');
}

// 4e. Table 排序 / 筛选契约（§30.36，T3-02）。T3-03 / T3-06 要继续往同一个
// TableState 加选择与分页，这里钉的是「协议形状 + 状态归属 + server 语义 + SSR 在册」，
// 都是后续批次最容易悄悄退化的点；语义正确性另由 Table.test.tsx 覆盖。
const tableTypes = read(join(tableDir, 'types.ts'));
if (
  !/interface TableChange\b/.test(tableTypes) ||
  !/pagination:\s*TablePaginationState \| undefined/.test(tableTypes) ||
  !/filters:\s*TableFilters;/.test(tableTypes) ||
  !/sorter:\s*TableSorter;/.test(tableTypes)
) {
  fail('TableChange 未一次定清 onChange 的 pagination / filters / sorter 三参协议');
}
if (!/createSignal/.test(tableEngine) || /createSignal/.test(tableImpl)) {
  fail('排序 / 筛选状态必须收在 useTableEngine 内：视图不得自建 signal');
}
if (!/server\s*\?\s*rawRows\s*:\s*applySorters\(applyFilters\(/.test(tableEngine)) {
  fail('服务端模式未走「只出参数、不本地改数据」分支');
}
// T3-06 起 emit 是三参：分页变更也走同一个出口，排序 / 筛选变更必须带出
// 完整分页快照；筛选还要取**筛选后**的快照，否则客户端模式的 total 会发旧值。
if (
  !/emit\(next, current\.filters, current\.pagination\)/.test(tableEngine) ||
  !/emit\(after\.sorters, next, resetPageAfterFilter\(after\.pagination\)\)/.test(tableEngine) ||
  !/const after = state\(\)/.test(tableEngine)
) {
  fail('排序 / 筛选变更未各自带出完整三参快照（或筛选沿用了变化前的分页 total）');
}
if (!/const columns = createMemo\(\(\) => resolveColumns/.test(tableEngine)) {
  fail('列归一化未单独缓存：表头会被每次筛选点击整体重建（筛选面板 input 脱管）');
}
if (!ssrSmokeRunner.includes("id: 'T3-02'")) {
  fail('Table 排序 / 筛选的 SSR 入口未登记进 ssr-smoke.mjs');
}

// 4f. Table 行选择契约（§30.37，T3-03）。钉三件最容易悄悄退化的事：
// ① 半选是第三态，`aria-checked="mixed"` 必须真的存在（只有 checked 布尔是假半选）；
// ② 禁用行不进全选集合，靠 `data-scui-row-disabled` 表达而不是降文字对比度；
// ③ 行选择控件不得复用 Checkbox / Radio —— CSS 按组件目录独立产出、无依赖聚合，
//    复用会让「只引 table 样式」的使用方拿到裸 input。
const tableSsrSelection = join(tableDir, '__tests__', 'ssr-selection.tsx');
if (!tableImpl.includes('data-scui-selected') || !tableImpl.includes('data-scui-row-disabled')) {
  fail('Table.tsx 未输出 data-scui-selected / data-scui-row-disabled（行选中与禁用行的唯一真源）');
}
if (!/scuiRole="select-all"/.test(tableImpl) || !/scuiRole="select-row"/.test(tableImpl)) {
  fail('Table.tsx 未输出 select-all / select-row 锚点');
}
if (!/'mixed'/.test(tableImpl)) {
  fail('行选择未处理半选三态：checkbox 必须有 aria-checked="mixed"');
}
if (!/allSelected/.test(tableEngine) || !/someSelected/.test(tableEngine)) {
  fail('引擎未派生全选 / 半选：三态必须在 TableState 里算，视图不得自己数');
}
if (/from '\.\.\/(checkbox|radio)'/.test(tableImpl) || /scui-(checkbox|radio)/.test(tableStyles)) {
  fail('行选择控件复用了 Checkbox / Radio：CSS 逐组件独立产出，只引 table 样式时会裸样式');
}
if (!existsSync(tableSsrSelection) || !ssrSmokeRunner.includes("id: 'T3-03'")) {
  fail('Table 行选择的 SSR 入口未登记进 ssr-smoke.mjs');
}

// 4g. Pagination 契约（§30.38，T3-04）。验收三条里最容易「看着对、其实漏」的部分：
// ① 收敛如果在视图做（直接渲染 props.current），越界值会漏到 DOM 与 SSR；
// ② 当前页只给 aria-current 会导致样式只能靠文本抓节点，必须有 data-scui-current；
// ③ 每页条数写 <select value> 在 SSR 不是标准属性，首帧会选错项。
const paginationDir = join(repoRoot, 'packages', 'core', 'src', 'components', 'pagination');
const paginationImpl = read(join(paginationDir, 'Pagination.tsx'));
const paginationEngine = read(join(paginationDir, 'pagination-engine.ts'));
const paginationStyles = read(join(paginationDir, 'pagination.scss'));
if (paginationImpl.length === 0 || paginationEngine.length === 0 || paginationStyles.length === 0) {
  fail('Pagination 缺少 Pagination.tsx / pagination-engine.ts / pagination.scss（T3-04 纵向切片）');
} else {
  // 判据只认真实代码。本批次实测踩到两次注释冒充判据：
  // ① 视图头注释写了 `aria-current="page"`，删掉真实输出后正则仍命中 → 假绿；
  //    `tabindex="-1"` 写进注释则相反，会把合规代码判成红灯。
  // ② `<select[\s\S]{0,200}value=` 这种跨节点正则会误命中后面的 `<input value>`。
  // 所以统一先剥注释，select 只看开标签。
  const stripPaginationComments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const paginationCode = stripPaginationComments(paginationImpl);
  const paginationEngineCode = stripPaginationComments(paginationEngine);

  if (!/usePaginationEngine\s*\(/.test(paginationCode)) {
    fail('Pagination.tsx 未调用 usePaginationEngine：页码收敛与受控优先级必须在引擎里');
  }
  if (/(?:props|local)\.(current|pageSize|total)\b/.test(paginationCode)) {
    fail(
      'Pagination.tsx 直接读取 current / pageSize / total：必须先经引擎收敛，否则越界值会漏到 DOM',
    );
  }
  if (!/clampPage/.test(paginationEngineCode) || !/getPageCount/.test(paginationEngineCode)) {
    fail('分页引擎未用 clampPage / getPageCount：总页数变化时当前页无法收敛');
  }
  if (
    !/controlledCurrent/.test(paginationEngineCode) ||
    !/controlledPageSize/.test(paginationEngineCode)
  ) {
    fail('分页引擎未区分受控 / 非受控：受控时点击不得回写内部状态');
  }
  if (!/aria-current/.test(paginationCode) || !/data-scui-current/.test(paginationCode)) {
    fail('Pagination.tsx 未同时输出 aria-current 与 data-scui-current（当前页双通道）');
  }
  const paginationSelectTag = paginationCode.match(/<select\b[^>]*>/)?.[0] ?? '';
  if (/value=/.test(paginationSelectTag)) {
    fail('Pagination.tsx 在 <select> 上用 value：SSR 不是标准属性，首帧会选错项');
  }
  if (!/selected=\{/.test(paginationCode)) {
    fail('Pagination.tsx 未在 <option> 上输出 selected：SSR 首帧与客户端不一致');
  }
  if (/tabindex=["']?-1/i.test(paginationCode)) {
    fail('Pagination.tsx 给控件加了 tabindex="-1"：键盘 Tab 可达性失守');
  }
  if (!/flex-wrap:\s*wrap/.test(paginationStyles)) {
    fail('pagination.scss 未设置 flex-wrap：375px 下会横向溢出');
  }
  const paginationSsrEntry = join(paginationDir, '__tests__', 'ssr-entry.tsx');
  if (!existsSync(paginationSsrEntry) || !ssrSmokeRunner.includes("id: 'T3-04'")) {
    fail('Pagination 的 SSR 入口未登记进 ssr-smoke.mjs');
  }
}

// 4h. 空 / 加载三件套契约（§30.39，T3-05）。钉的都是「看着对、其实错」的实现：
// ① Empty 若写成 `image ?? 默认插画`，`image={null}`（纯文字空状态）就永远退化不出来；
// ② Skeleton 的行高写裸 px、或用 margin 造行间隙，骨架总高就不等于真实文本高度，
//    切内容时整页跳一下 —— 这正是 T3-05 验收列点名的「切换不产生布局抖动」；
// ③ Skeleton 的形状分派若是组件调用（`<Body />`），Solid 只执行一次 setup，
//    variant 从 text 切 table 时 DOM 不会变；
// ④ Spin 的 delay 若不在 effect 里 onCleanup，延迟期内取消会留下野定时器，
//    遮罩在用户已经拿到数据之后再弹出来。
const emptyDir = join(repoRoot, 'packages', 'core', 'src', 'components', 'empty');
const skeletonDir = join(repoRoot, 'packages', 'core', 'src', 'components', 'skeleton');
const spinDir = join(repoRoot, 'packages', 'core', 'src', 'components', 'spin');
const emptyImpl = read(join(emptyDir, 'Empty.tsx'));
const skeletonImpl = read(join(skeletonDir, 'Skeleton.tsx'));
const skeletonStyles = read(join(skeletonDir, 'skeleton.scss'));
const spinImpl = read(join(spinDir, 'Spin.tsx'));

if (!emptyImpl || !skeletonImpl || !skeletonStyles || !spinImpl) {
  fail('缺少 Empty / Skeleton / Spin 的纵向切片源文件（T3-05）');
} else {
  // 与 4g 同理：头注释里写了 `image={null}` / `margin` / `onCleanup` 会让判据变成
  // 「注释冒充实现」的假绿，先剥注释再看代码。
  const stripT305Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const emptyCode = stripT305Comments(emptyImpl);
  const skeletonCode = stripT305Comments(skeletonImpl);
  const skeletonStyleCode = stripT305Comments(skeletonStyles);
  const spinCode = stripT305Comments(spinImpl);

  // Empty
  if (!/aria-hidden="true"/.test(emptyCode)) {
    fail('Empty 的内置插画缺少 aria-hidden：装饰性图形会被读屏念成内容');
  }
  if (!/!==\s*null/.test(emptyCode)) {
    fail('Empty 未区分「未传 image」与「image={null}」：用 ?? 判空会让纯文字空状态失效');
  }
  if (!/when=\{local\.children\}/.test(emptyCode) || !/empty__footer/.test(emptyCode)) {
    fail('Empty 的操作区未按需渲染：不传 children 时仍会留一个空 box');
  }

  // Skeleton 尺寸纪律
  if (!/--scui-skeleton-line-block:\s*var\(--scui-line-height-md/.test(skeletonStyleCode)) {
    fail('skeleton.scss 的行块高未引用 --scui-line-height-md：骨架与正文行高脱钩');
  }
  if (!/block-size:\s*var\(--scui-skeleton-line-block\)/.test(skeletonStyleCode)) {
    fail('skeleton.scss 的行容器未用 --scui-skeleton-line-block：行高被写死');
  }
  if (!/--scui-skeleton-bar-block:\s*calc\(/.test(skeletonStyleCode)) {
    fail('skeleton.scss 的 bar 高度未用 calc 从行块高扣减：间隙靠 margin 会让总高偏大');
  }
  if (
    !/block-size:\s*calc\(var\(--scui-skeleton-line-block\)\s*\+\s*2\s*\*\s*var\(--scui-space-3/.test(
      skeletonStyleCode,
    )
  ) {
    fail('skeleton.scss 的表格行高未按「行高 + 2 × 单元格内距」计算：与 Table 默认密度不同高');
  }
  if (/<Body\s*\/>/.test(skeletonCode) || !/renderBody\(\)/.test(skeletonCode)) {
    fail('Skeleton 的形状分派写成了组件调用：Solid 只在 setup 执行一次，variant 切换不会更新 DOM');
  }

  // Spin 延迟语义
  if (!/onCleanup\(/.test(spinCode) || !/clearTimeout\(/.test(spinCode)) {
    fail('Spin 的 delay 定时器没有 onCleanup 清理：延迟期内取消会留下野定时器');
  }
  if (!/createSignal\(\s*spinning\(\)\s*&&\s*delay\(\)\s*===\s*0\s*\)/.test(spinCode)) {
    fail('Spin 的可见性初值不是同步算出来的：首帧会「该转的没转」，且 SSR 与客户端不一致');
  }
  if (!/role="status"/.test(spinCode)) {
    fail('Spin 缺少 role="status"：读屏无法得知区域正在更新');
  }
  if (!/加载中/.test(spinCode)) {
    fail('Spin 在无 tip 时没有视觉隐藏文案：读屏面对的是一段无声旋转图形');
  }
  if (!/data-scui-spinning/.test(spinCode)) {
    fail('Spin 未输出 data-scui-spinning：包裹态的样式与测试失去唯一真源');
  }

  const t305Entries = [
    ['empty', emptyDir, 'T3-05-empty'],
    ['skeleton', skeletonDir, 'T3-05-skeleton'],
    ['spin', spinDir, 'T3-05-spin'],
  ];
  for (const [name, dir, id] of t305Entries) {
    if (!existsSync(join(dir, '__tests__', 'ssr-entry.tsx'))) {
      fail(`${name} 缺少 SSR 入口 __tests__/ssr-entry.tsx`);
    }
    if (!ssrSmokeRunner.includes(`id: '${id}'`)) {
      fail(`${name} 的 SSR 入口未登记进 ssr-smoke.mjs（id: '${id}'）`);
    }
  }
}

// 4i. Table 分页接入 + 空 / 加载态契约（§30.40，T3-06）。钉的都是「看着接上了、
// 其实没接对」的点：① 三个组件必须组合而非复制，且样式要一起带进 Table 的样式表；
// ② footer 必须在 overflow-x 滚动容器之外；③ 分页状态仍归引擎、server 不切数据；
// ④ TableChange.pagination 不能继续硬编码 undefined；⑤ 空 / 加载态互斥且占位
// 跨列数按列配置算；⑥ SSR 入口在册。
{
  const stripT306Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const t306Impl = stripT306Comments(tableImpl);
  const t306Engine = stripT306Comments(tableEngine);
  const t306Styles = stripT306Comments(tableStyles);
  const t306Types = stripT306Comments(tableTypes);

  for (const [name, specifier] of [
    ['Pagination', '../pagination'],
    ['Empty', '../empty'],
    ['Spin', '../spin'],
  ]) {
    if (!t306Impl.includes(`from '${specifier}'`)) {
      fail(`Table.tsx 未组合 ${name} 组件：T3-06 要求直接复用，不在 Table 里复制一套`);
    }
  }
  // build-css.mjs 按组件目录逐个编译、不做依赖聚合，不引用就会让「只引 Table
  // 单组件样式」的使用方拿到裸按钮 / 裸转圈（与 4f 不复用 Checkbox 同源）。
  for (const name of ['empty', 'pagination', 'spin']) {
    if (!new RegExp(`@use\\s+['"]\\.\\./${name}/${name}['"]`).test(t306Styles)) {
      fail(`table.scss 未引用 ${name} 的样式：只引 Table 样式时会渲染出裸控件`);
    }
  }

  const tableClose = t306Impl.lastIndexOf('</table>');
  const scrollClose = t306Impl.indexOf('</div>', tableClose);
  const footerAt = t306Impl.indexOf('data-scui-role="table-footer"');
  if (
    !t306Impl.includes('data-scui-role="table-root"') ||
    !t306Impl.includes('data-scui-role="table-scroll"') ||
    !(tableClose >= 0 && scrollClose > tableClose && footerAt > scrollClose)
  ) {
    fail('Table 的分页 footer 未放在滚动容器之外（或缺少 root / scroll 分层）');
  }

  // 只在 TableState 接口体内判定：引擎里还有一处局部变量
  // `const pagination: TablePaginationState | undefined`，全文搜这个串会假绿。
  const tableStateBody =
    t306Engine.match(/export interface TableState<[^>]*>\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  if (!/pagination:\s*TablePaginationState \| undefined/.test(tableStateBody)) {
    fail('分页状态未收进 TableState：视图不得另建 signal 或散读 props 配置');
  }
  if (/pagination:\s*undefined\s*\}/.test(t306Engine)) {
    fail('TableChange.pagination 仍被硬编码成 undefined：T3-06 必须填真实分页快照');
  }
  if (
    !/from '\.\.\/pagination\/pagination-engine'/.test(t306Engine) ||
    !/clampPage\(/.test(t306Engine) ||
    !/getPageCount\(/.test(t306Engine)
  ) {
    fail('Table 分页未复用 Pagination 引擎的收敛纯函数：会维护出两套不一致的页码算法');
  }
  if (!/pagination === undefined \|\| server \? rows : rows\.slice\(/.test(t306Engine)) {
    fail('服务端模式被本地切页了：server 只出参数，数据由调用方请求后回写');
  }
  if (!/server\s*\?\s*normalizeTotal\(config\.total/.test(t306Engine)) {
    fail('服务端模式的 total 未取自调用方配置：业务侧无法拿到完整请求参数');
  }
  if (
    !/config\.current === undefined/.test(t306Engine) ||
    !/config\.pageSize === undefined/.test(t306Engine) ||
    !/setInternalPage\(change\.current\)/.test(t306Engine)
  ) {
    fail('分页受控优先级缺失：受控时点击不得回写 Table 的内部状态');
  }
  if (!/setInternalPage\(1\)/.test(t306Engine)) {
    fail('筛选归一页码只发了事件、没写回非受控内部信号：下次翻页会从旧基准算起');
  }

  if (!/when=\{state\(\)\.empty\}/.test(t306Impl) || !/<Empty\b/.test(t306Impl)) {
    fail('Table 空态未复用 Empty（或占位条件没走引擎的 empty 快照）');
  }
  if (!/when=\{state\(\)\.loading\}/.test(t306Impl) || !/<Spin\b/.test(t306Impl)) {
    fail('Table 加载态未复用 Spin');
  }
  if (!/disabled=\{state\(\)\.loading\}/.test(t306Impl)) {
    fail('加载中未禁用分页：遮罩只挡鼠标，键盘仍可翻页');
  }
  if (!/empty:\s*viewRows\.length === 0 && !loading/.test(t306Engine)) {
    fail('空态与加载态没有互斥：两者会同时渲染');
  }
  if (!/Math\.max\(\s*1,\s*state\(\)\.columns\.length/.test(t306Impl)) {
    fail('空态占位行的 colspan 写死了列数：启用行选择或改列数时会串列');
  }
  if (!/pagination\?: TablePaginationConfig \| false/.test(t306Types)) {
    fail('TableProps 缺少 pagination 配置或 false 开关：无法保持既有表格 DOM 不变');
  }
  if (!/interface TablePaginationConfig/.test(t306Types)) {
    fail('缺少 TablePaginationConfig：Table 不应直接复用 MaybeAccessor 形态的 PaginationProps');
  }
  if (
    !existsSync(join(tableDir, '__tests__', 'ssr-pagination.tsx')) ||
    !ssrSmokeRunner.includes("id: 'T3-06'")
  ) {
    fail('Table 分页 / 空 / 加载态的 SSR 入口未登记进 ssr-smoke.mjs');
  }
}

// 4j. Modal 契约（§30.41，T3-07）。钉的都是「看着接上了、其实没接对」的点：
// ① 必须复用共享浮层原语，且第三方类型不越过 primitives；② 焦点归还必须自己
// 接管（Kobalte 只 focus triggerRef，受控打开时为空）；③ 异步 pending 要同时
// 挡住重复提交与全部关闭入口；④ 受控优先级；⑤ footer 样式随 modal.css 聚合；
// ⑥ SSR 入口在册。判据一律先剥注释，避免注释冒充真实代码（T3-04 / T3-05 踩过）。
{
  const stripT307Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const modalDir = join(repoRoot, 'packages', 'core', 'src', 'components', 'modal');
  const primitivesDir = join(repoRoot, 'packages', 'core', 'src', 'primitives');
  const t307Impl = stripT307Comments(read(join(modalDir, 'Modal.tsx')));
  const t307Styles = stripT307Comments(read(join(modalDir, 'modal.scss')));
  const t307Types = stripT307Comments(read(join(modalDir, 'types.ts')));
  const t307Overlay = stripT307Comments(read(join(primitivesDir, 'overlay.tsx')));
  const t307Primitives = stripT307Comments(read(join(primitivesDir, 'index.ts')));
  const t307PrimitiveTypes = stripT307Comments(read(join(primitivesDir, 'types.ts')));

  if (
    !t307Impl.includes("from '../../primitives'") ||
    !/<PrimitiveOverlay\b/.test(t307Impl) ||
    /@kobalte\//.test(t307Impl)
  ) {
    fail(
      'Modal 未复用 primitives/overlay（或直接依赖了第三方无头库）：T3-08 的 Drawer 会重复实现浮层',
    );
  }
  if (
    !t307Primitives.includes("export { PrimitiveOverlay } from './overlay';") ||
    !/export interface PrimitiveOverlayProps/.test(t307PrimitiveTypes) ||
    /@kobalte\//.test(t307PrimitiveTypes)
  ) {
    fail('共享浮层原语未从 primitives barrel / types 正确导出，或第三方类型越过了接缝');
  }
  if (
    !/document\.activeElement/.test(t307Overlay) ||
    !/setRestoreTarget\(active\)/.test(t307Overlay) ||
    !/event\.preventDefault\(\)/.test(t307Overlay) ||
    !/target\.focus\(\)/.test(t307Overlay)
  ) {
    fail('浮层原语未自己接管焦点归还：受控打开没有 Kobalte Trigger，焦点会丢在 body 上');
  }
  if (!/Show when=\{ready\(\)\}/.test(t307Overlay) || !/useClientReady\(\)/.test(t307Overlay)) {
    fail('浮层 Portal 未受 useClientReady 约束：SSR 与客户端首帧结构会对不上');
  }
  for (const hook of [
    'onEscapeKeyDown={onEscapeKeyDown}',
    'onPointerDownOutside={blockOutside}',
    'onInteractOutside={blockOutside}',
  ]) {
    if (!t307Overlay.includes(hook)) {
      fail(`浮层原语缺少 ${hook}：异步提交期间的关闭拦截会漏一条路径`);
    }
  }
  if (
    !/!dismissible\(\) \|\| !keyboard\(\)/.test(t307Overlay) ||
    !/!dismissible\(\) \|\| !maskClosable\(\)/.test(t307Overlay) ||
    !/onPointerDown=\{onMaskPointerDown\}/.test(t307Overlay) ||
    !/props\.onOpenChange\?\.\(false\)/.test(t307Overlay)
  ) {
    fail(
      '遮罩关闭未走单一出口：Kobalte modal 模式默认点遮罩不 dismiss，必须显式挂 Overlay 的 onPointerDown，且 keyboard / maskClosable 与 pending 拦截要分开',
    );
  }
  if (
    !t307Impl.includes('local.open ?? internalOpen()') ||
    !/if \(local\.open === undefined\) setInternalOpen\(false\)/.test(t307Impl)
  ) {
    fail('Modal 受控优先级缺失：受控时点击不得回写组件内部信号');
  }
  if (
    !/if \(isPending\(\)\) return;/.test(t307Impl) ||
    !/result\.then\(/.test(t307Impl) ||
    !/confirmLoading === true \|\| asyncPending\(\)/.test(t307Impl)
  ) {
    fail('异步关闭状态机不完整：重复提交或 Promise reject 会漏掉一条路径');
  }
  if (
    !/dismissible=\{!isPending\(\)\}/.test(t307Impl) ||
    !/'data-scui-pending': isPending\(\) \? '' : undefined/.test(t307Impl)
  ) {
    fail('pending 未同时驱动原语拦截与 data-scui-pending：ESC / 遮罩仍能关掉等待中的弹层');
  }
  if (!/local\.footer === null/.test(t307Impl)) {
    fail('footer={null} 语义缺失：会留下一个空的操作区盒子');
  }
  if (!/@use\s+['"]\.\.\/button\/button['"]/.test(t307Styles)) {
    fail('modal.scss 未聚合 Button 样式：只引 modal.css 时默认 footer 会渲染成两个裸按钮');
  }
  if (
    !/onOk\?: \(\) => void \| Promise<void>/.test(t307Types) ||
    !/footer\?: JSX\.Element \| null/.test(t307Types)
  ) {
    fail('ModalProps 缺少异步 onOk / footer=null 的契约声明');
  }
  if (
    !existsSync(join(modalDir, '__tests__', 'ssr-entry.tsx')) ||
    !ssrSmokeRunner.includes("id: 'T3-07'")
  ) {
    fail('Modal 的 SSR 入口未登记进 ssr-smoke.mjs');
  }
}

// 4k. Drawer 契约（§30.42，T3-08）。§4.2 T3-08 验收原话「与 Modal 共用焦点管理
// 与浮层原语，不重复实现；四方向 + 尺寸；键盘与 axe 通过」的机器闸门。
// 钉的都是「看着接上了、其实没接对」的点：① 组件层必须零浮层实现，全部走
// primitives/overlay；② 四方向在类型 / 运行时属性 / 贴边样式三层同时齐全；
// ③ width / height 必须按方向归一，不能把 width 用到 top / bottom；
// ④ 受控优先级；⑤ 贴边用逻辑属性且窄屏有收窄；⑥ footer 插槽样式随
// drawer.css 聚合；⑦ SSR 入口在册。判据一律先剥注释，避免注释冒充真实代码。
{
  const stripT308Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const drawerDir = join(repoRoot, 'packages', 'core', 'src', 'components', 'drawer');
  const t308Impl = stripT308Comments(read(join(drawerDir, 'Drawer.tsx')));
  const t308Styles = stripT308Comments(read(join(drawerDir, 'drawer.scss')));
  const t308Types = stripT308Comments(read(join(drawerDir, 'types.ts')));

  if (
    !t308Impl.includes("from '../../primitives'") ||
    !/<PrimitiveOverlay\b/.test(t308Impl) ||
    /@kobalte\//.test(t308Impl)
  ) {
    fail('Drawer 未复用 primitives/overlay（或直接依赖了第三方无头库）：会与 Modal 重复实现浮层');
  }
  // 组件层出现任何浮层行为关键字都算重复实现：Portal / focus scope / ESC /
  // outside dismiss / 焦点归还全部只属于 primitives/overlay。
  const leaked = [
    'document.activeElement',
    'useClientReady',
    'onEscapeKeyDown',
    'onPointerDownOutside',
    'onInteractOutside',
    'onOpenAutoFocus',
    'onCloseAutoFocus',
    'KobalteDialog',
    '<Portal',
    'createPortal',
  ].filter((token) => t308Impl.includes(token));
  if (leaked.length > 0) {
    fail(
      `Drawer 组件层重复实现了浮层行为（${leaked.join(', ')}）：必须只由 primitives/overlay 实现一次`,
    );
  }
  if (!/DrawerPlacement = 'left' \| 'right' \| 'top' \| 'bottom'/.test(t308Types)) {
    fail('DrawerPlacement 四方向枚举不完整：漏一个方向会让 SCSS 贴边规则成为死代码');
  }
  for (const side of ['left', 'right', 'top', 'bottom']) {
    if (!t308Styles.includes(`[data-scui-side='${side}']`)) {
      fail(`drawer.scss 缺少 ${side} 方向的贴边规则：四方向验收会只跑通一半`);
    }
  }
  if (
    !/'data-scui-side': side\(\)/.test(t308Impl) ||
    !/'data-scui-size': size\(\)/.test(t308Impl) ||
    !/const side = \(\) => local\.placement \?\? 'right'/.test(t308Impl) ||
    !/const size = \(\) => local\.size \?\? 'medium'/.test(t308Impl)
  ) {
    fail(
      'Drawer 的 data-scui-side / data-scui-size 未恒输出或默认值缺失：SSR 与客户端属性会对不上',
    );
  }
  if (
    !/isVerticalSide\(side\(\)\) \? local\.height : local\.width/.test(t308Impl) ||
    !/side === 'top' \|\| side === 'bottom'/.test(t308Impl) ||
    !/toCssSize\(explicit\)/.test(t308Impl)
  ) {
    fail('显式尺寸未按方向归一：top / bottom 会错误地读取 width，或数字没有被转成 px');
  }
  if (
    !t308Impl.includes('local.open ?? internalOpen()') ||
    !/if \(local\.open === undefined\) setInternalOpen\(false\)/.test(t308Impl) ||
    !/footer=\{local\.footer\}/.test(t308Impl)
  ) {
    fail('Drawer 受控优先级或 footer 插槽透传缺失：受控时会自己改状态，或底部操作区被吞掉');
  }
  for (const rule of [
    'inset-inline-end: auto',
    'inset-inline-start: auto',
    'inset-block-end: auto',
    'inset-block-start: auto',
    'max-inline-size: 100vw',
    'max-block-size: 100vh',
  ]) {
    if (!t308Styles.includes(rule)) {
      fail(`drawer.scss 缺少 ${rule}：贴边定位或 375px 窄屏收窄会失效`);
    }
  }
  if (
    !/--scui-drawer-size: 378px/.test(t308Styles) ||
    !/\[data-scui-size='small'\]/.test(t308Styles) ||
    !/\[data-scui-size='large'\]/.test(t308Styles)
  ) {
    fail('三档尺寸没有统一落到 --scui-drawer-size：内联显式尺寸无法覆盖档位');
  }
  if (!/@use\s+['"]\.\.\/button\/button['"]/.test(t308Styles)) {
    fail('drawer.scss 未聚合 Button 样式：footer 插槽放按钮时只引 drawer.css 会拿到裸按钮');
  }
  if (
    !/footer\?: JSX\.Element \| null/.test(t308Types) ||
    !/width\?: number \| string/.test(t308Types) ||
    !/height\?: number \| string/.test(t308Types)
  ) {
    fail('DrawerProps 缺少 footer=null / 显式宽高的契约声明');
  }
  if (
    !existsSync(join(drawerDir, '__tests__', 'ssr-entry.tsx')) ||
    !ssrSmokeRunner.includes("id: 'T3-08'")
  ) {
    fail('Drawer 的 SSR 入口未登记进 ssr-smoke.mjs');
  }
}

// 4l. T3-09 反馈与锚定浮层契约（§30.43）。§4.2 验收原话「Tooltip 定位 / 延迟 /
// 箭头；Popconfirm 异步确认；Alert 可关闭与操作区；全局反馈能脱离树调用且 SSR
// 不报错」+ 锚点「锚定浮层不复用 Dialog 原语，但不得重复实现焦点归还与 ESC 契约」。
// 钉的都是「看着接上了、其实没接对」的点：① 组件层零浮层实现，全部走
// primitives/anchored；② 锚定原语自身也不写第二套焦点归还；③ 十二向在类型 /
// 运行时属性 / 方向样式三层齐全；④ 延迟真正透传原语；⑤ pending 协议与 Modal
// 同形且 reject 保持打开；⑥ Alert 四种 kind / 可关闭 / 操作区；⑦ 三个 SSR 入口
// 在册且真的调用了静态 message / useApp。判据一律先剥注释，避免注释冒充代码。
{
  const stripT309Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const componentsDir = join(repoRoot, 'packages', 'core', 'src', 'components');
  const primitivesDir = join(repoRoot, 'packages', 'core', 'src', 'primitives');
  const t309Impl = {};
  const t309Styles = {};
  const t309Types = {};
  for (const name of ['alert', 'tooltip', 'popconfirm']) {
    t309Impl[name] = stripT309Comments(
      read(
        join(
          componentsDir,
          name,
          name === 'popconfirm' ? 'Popconfirm.tsx' : `${name[0].toUpperCase()}${name.slice(1)}.tsx`,
        ),
      ),
    );
    t309Styles[name] = stripT309Comments(read(join(componentsDir, name, `${name}.scss`)));
    t309Types[name] = stripT309Comments(read(join(componentsDir, name, 'types.ts')));
  }
  const t309Anchored = stripT309Comments(read(join(primitivesDir, 'anchored.tsx')));
  const t309Primitives = stripT309Comments(read(join(primitivesDir, 'index.ts')));
  const t309PrimitiveTypes = stripT309Comments(read(join(primitivesDir, 'types.ts')));
  const t309AlertSsr = stripT309Comments(
    read(join(componentsDir, 'alert', '__tests__', 'ssr-entry.tsx')),
  );
  const t309AlertDemo = stripT309Comments(
    read(join(componentsDir, 'alert', 'demos', 'action.tsx')),
  );
  const t309DataAttrs = read(
    join(repoRoot, 'packages', 'core', 'spikes', 'api-draft', 'data-attributes.md'),
  );

  // ① 组件层零浮层实现：Tooltip / Popconfirm 只能认原语，不许直接碰 Kobalte。
  for (const name of ['tooltip', 'popconfirm']) {
    if (
      !t309Impl[name].includes("from '../../primitives'") ||
      !new RegExp(`<Primitive${name === 'tooltip' ? 'Tooltip' : 'Popover'}\\b`).test(t309Impl[name])
    ) {
      fail(`${name} 未复用 primitives/anchored：会与模态浮层重复实现 Portal / 焦点 / ESC`);
    }
    const leaked = [
      'document.activeElement',
      'useClientReady',
      'onEscapeKeyDown',
      'onPointerDownOutside',
      'onInteractOutside',
      'onOpenAutoFocus',
      'onCloseAutoFocus',
      'onFocusOutside',
      'KobalteDialog',
      'KobalteTooltip',
      'KobaltePopover',
      '<Portal',
      'createPortal',
      '@kobalte/',
    ].filter((token) => t309Impl[name].includes(token));
    if (leaked.length > 0) {
      fail(
        `${name} 组件层重复实现了浮层行为（${leaked.join(', ')}）：必须只由 primitives/anchored 实现一次`,
      );
    }
  }

  // ② 锚定原语有 Trigger，焦点归还由 Kobalte 的 ButtonRoot 默认行为负责；
  // 这里再写一套 activeElement / onCloseAutoFocus 就是锚点明令禁止的第二套语义。
  if (
    !t309Anchored.includes('@kobalte/core/tooltip') ||
    !t309Anchored.includes('@kobalte/core/popover') ||
    !/onEscapeKeyDown=\{blockDismiss\}/.test(t309Anchored) ||
    !/props\.dismissible !== false/.test(t309Anchored)
  ) {
    fail('锚定原语未把 ESC / outside dismiss 收敛到同一道 preventDefault 闸门');
  }
  if (/onOpenAutoFocus|onCloseAutoFocus|document\.activeElement/.test(t309Anchored)) {
    fail('锚定原语重复实现了焦点归还：有 Trigger 时应交给 Kobalte，不能复制模态浮层那套');
  }
  if (
    !t309Primitives.includes("export { PrimitivePopover, PrimitiveTooltip } from './anchored';") ||
    !/export interface PrimitiveTooltipProps/.test(t309PrimitiveTypes) ||
    !/export interface PrimitivePopoverProps/.test(t309PrimitiveTypes) ||
    !/export type PrimitiveAnchoredAttributes/.test(t309PrimitiveTypes)
  ) {
    fail('primitives barrel / types 未登记锚定原语：上层组件与消费方会拿到不完整的契约');
  }

  // ③ 十二向枚举 + 恒输出的 data-scui-anchor + 四向方向样式，缺一层即死代码。
  const placementBody =
    t309PrimitiveTypes.match(/export type PrimitiveAnchorPlacement =([\s\S]*?);/)?.[1] ?? '';
  for (const side of [
    'top',
    'top-start',
    'top-end',
    'right',
    'right-start',
    'right-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'left-start',
    'left-end',
  ]) {
    if (!placementBody.includes(`'${side}'`)) {
      fail(`PrimitiveAnchorPlacement 缺少 ${side}：该方向的浮层无法被表达`);
    }
  }
  for (const name of ['tooltip', 'popconfirm']) {
    if (
      !/'data-scui-anchor': placement\(\)/.test(t309Impl[name]) ||
      !/local\.placement \?\? 'top'/.test(t309Impl[name]) ||
      !t309Impl[name].includes('local.open ?? internalOpen()') ||
      !/if \(local\.open === undefined\) setInternalOpen\(/.test(t309Impl[name])
    ) {
      fail(`${name} 的方向未恒输出或受控优先级缺失：SSR / 客户端属性会对不上`);
    }
    for (const prefix of ['top', 'bottom', 'left', 'right']) {
      if (!t309Styles[name].includes(`[data-scui-anchor^='${prefix}']`)) {
        fail(`${name}.scss 缺少 ${prefix} 方向规则：data-scui-anchor 会变成纯装饰属性`);
      }
    }
  }
  if (!/\| `data-scui-anchor` \|/.test(t309DataAttrs)) {
    fail('data-attributes.md 未登记 data-scui-anchor：新增属性必须落表且与既有语义区分');
  }

  // ④ 延迟必须真正透传到 Kobalte，组件层写个默认值再丢掉会让「延迟」变成死代码。
  if (
    !/openDelay=\{local\.openDelay \?\? 200\}/.test(t309Impl.tooltip) ||
    !/closeDelay=\{local\.closeDelay \?\? 100\}/.test(t309Impl.tooltip) ||
    !/openDelay=\{props\.openDelay \?\? 200\}/.test(t309Anchored) ||
    !/closeDelay=\{props\.closeDelay \?\? 100\}/.test(t309Anchored) ||
    !/openDelay\?: number/.test(t309Types.tooltip) ||
    !/closeDelay\?: number/.test(t309Types.tooltip)
  ) {
    fail('Tooltip 的 openDelay / closeDelay 未在类型与两层实现中同时透传');
  }

  // ⑤ pending 协议与 Modal 同形：属性恒在有值时输出、防重复提交早退、
  // resolve 才关闭、reject 保持打开，并且关闭拦截交给原语闸门而非新出口。
  if (
    !/'data-scui-pending': isPending\(\) \? '' : undefined/.test(t309Impl.popconfirm) ||
    !/dismissible=\{!isPending\(\)\}/.test(t309Impl.popconfirm) ||
    !/onOk\?: \(\) => void \| Promise<void>/.test(t309Types.popconfirm)
  ) {
    fail('Popconfirm 未复用 data-scui-pending / dismissible 闸门：异步期间会出现重复提交');
  }
  const okBody = t309Impl.popconfirm.match(/const handleOk = \([\s\S]*?\n  \};/)?.[0] ?? '';
  if (
    !/if \(isPending\(\)\) return;/.test(okBody) ||
    !/setAsyncPending\(false\);\s*applyClose\(\);/.test(okBody) ||
    !/\(\) => \{\s*setAsyncPending\(false\);\s*\},/.test(okBody)
  ) {
    fail('Popconfirm 的 Promise 分支不完整：resolve 未关闭或 reject 没有保持打开可重试');
  }
  if (!/@use\s+['"]\.\.\/button\/button['"]/.test(t309Styles.popconfirm)) {
    fail('popconfirm.scss 未聚合 Button 样式：只引 popconfirm.css 会拿到两个裸按钮');
  }

  // ⑥ Alert：kind 恒输出 / 可关闭 / 操作区都是真实条件渲染，不是注释里的占位。
  if (
    !/data-scui-kind=\{kind\(\)\}/.test(t309Impl.alert) ||
    !/local\.kind \?\? 'info'/.test(t309Impl.alert) ||
    !/when=\{local\.closable !== false\}/.test(t309Impl.alert) ||
    !/when=\{local\.action !== undefined\}/.test(t309Impl.alert) ||
    !/when=\{local\.icon !== null\}/.test(t309Impl.alert)
  ) {
    fail('Alert 的类型 / 可关闭 / 操作区 / 图标开关未全部落到真实渲染条件');
  }
  for (const kind of ['success', 'warning', 'error']) {
    if (!t309Styles.alert.includes(`[data-scui-kind='${kind}']`)) {
      fail(`alert.scss 缺少 ${kind} 配色规则：状态会只靠文案传达`);
    }
  }
  if (!/@use\s+['"]\.\.\/button\/button['"]/.test(t309Styles.alert)) {
    fail('alert.scss 未聚合 Button 样式：操作区放按钮时会拿到裸按钮');
  }

  // ⑦ 三个 SSR 入口在册，且 Alert 入口真的调用 T2-06 的静态通道。
  for (const id of ['T3-09-alert', 'T3-09-tooltip', 'T3-09-popconfirm']) {
    if (!ssrSmokeRunner.includes(`id: '${id}'`)) {
      fail(`T3-09 的 SSR 入口 ${id} 未登记进 ssr-smoke.mjs`);
    }
  }
  for (const dir of ['alert', 'tooltip', 'popconfirm']) {
    if (!existsSync(join(componentsDir, dir, '__tests__', 'ssr-entry.tsx'))) {
      fail(`${dir} 缺少 SSR 入口文件`);
    }
  }
  if (!/message\.success\(/.test(t309AlertSsr) || !/useApp\(\)/.test(t309AlertSsr)) {
    fail('T3-09 未在 SSR 入口真实调用静态 message / useApp：全局反馈接入只是文案');
  }
  if (!/message\.success\(/.test(t309AlertDemo)) {
    fail('Alert 操作区 Demo 未接入 T2-06 的静态 message 通道');
  }
}

// 4m. T3-10 展示组件契约（§30.44）。§4.2 验收原话「Card 标题 / 操作 / 封面 /
// 加载；Tag 颜色 / 可关闭 / 边框；各 ≥3 Demo + 视觉基线」的机器闸门。
// ① Card 四块结构按内容缺席；② 加载态复用 data-scui-loading 且真的组合
// Skeleton（不自建第二套骨架）；③ Tag 五档颜色在类型 / 运行时 / 样式三层齐全；
// ④ bordered 存在即真且样式真的改边框；⑤ 可关闭非受控 + 恒带 aria-label；
// ⑥ R1 / R3（无 modifier class、无 MaybeAccessor、属性与 role 登记在册）；
// ⑦ barrel / exports / catalog / Demo / 两个 SSR 入口在册。判据一律先剥注释，
// 避免注释冒充代码（T3-04 / T3-05 踩过）。
{
  const stripT310Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const componentsDir = join(repoRoot, 'packages', 'core', 'src', 'components');
  const coreSrc = join(repoRoot, 'packages', 'core', 'src');
  const t310Impl = {
    card: stripT310Comments(read(join(componentsDir, 'card', 'Card.tsx'))),
    tag: stripT310Comments(read(join(componentsDir, 'tag', 'Tag.tsx'))),
  };
  const t310Styles = {
    card: stripT310Comments(read(join(componentsDir, 'card', 'card.scss'))),
    tag: stripT310Comments(read(join(componentsDir, 'tag', 'tag.scss'))),
  };
  const t310Types = {
    card: stripT310Comments(read(join(componentsDir, 'card', 'types.ts'))),
    tag: stripT310Comments(read(join(componentsDir, 'tag', 'types.ts'))),
  };
  const t310DataAttrs = read(
    join(repoRoot, 'packages', 'core', 'spikes', 'api-draft', 'data-attributes.md'),
  );
  const t310Smoke = read(join(repoRoot, 'packages', 'core', 'spikes', 'shared', 'ssr-smoke.mjs'));
  const t310Catalog = read(join(repoRoot, 'apps', 'docs', 'src', 'content', 'catalog.mjs'));
  const t310Barrel = read(join(coreSrc, 'index.ts'));
  const t310Pkg = read(join(repoRoot, 'packages', 'core', 'package.json'));

  // ① 四块结构：每块都能按「是否传了内容」整块缺席，不留空盒子。
  for (const name of ['card-cover', 'card-header', 'card-title', 'card-extra', 'card-body']) {
    if (!t310Impl.card.includes(`data-scui-role="${name}"`)) {
      fail(`Card 缺少结构锚点 ${name}：四块结构必须各自可缺席`);
    }
  }
  if (!/<Show when=\{local\.cover !== undefined\}>/.test(t310Impl.card)) {
    fail('Card 封面未按内容整块缺席：不传 cover 时会留下空盒子');
  }
  if (
    !/local\.title !== undefined \|\| local\.extra !== undefined/.test(t310Impl.card) ||
    !/<Show when=\{hasHeader\(\)\}>/.test(t310Impl.card)
  ) {
    fail('Card 的 title / extra 未共用同一个表头：两者都为 undefined 时表头必须整块缺席');
  }

  // ② 加载态：复用既有属性 + 直接组合 T3-05 的 Skeleton，样式随之聚合。
  if (!/data-scui-loading=\{loading\(\) \? '' : undefined\}/.test(t310Impl.card)) {
    fail('Card 加载态未复用 data-scui-loading 的存在即真口径');
  }
  if (
    !t310Impl.card.includes("from '../skeleton'") ||
    !/<Skeleton variant="text" rows=\{3\}/.test(t310Impl.card)
  ) {
    fail('Card 未组合 T3-05 的 Skeleton：会与骨架组件重复实现占位');
  }
  if (!/<Show when=\{loading\(\)\} fallback=\{local\.children\}>/.test(t310Impl.card)) {
    fail('Card 加载时正文未换成 Skeleton：fallback 必须指向 children');
  }
  for (const token of ['skeleton__bar', '@keyframes', 'data-scui-variant']) {
    if (t310Impl.card.includes(token)) {
      fail(`Card 自建了骨架（${token}）：必须只组合 Skeleton`);
    }
  }
  if (
    !/&\[data-scui-loading\] \.scui-card__body/.test(t310Styles.card) ||
    !/min-block-size: calc\(var\(--scui-line-height-md/.test(t310Styles.card)
  ) {
    fail('Card 加载态样式未落地：card.scss 缺少 [data-scui-loading] 的三行占位');
  }
  if (
    !t310Styles.card.includes("@use '../skeleton/skeleton';") ||
    !t310Styles.card.includes("@use '../button/button';")
  ) {
    fail('Card 样式未聚合 Skeleton / Button：CSS 逐目录编译不做依赖聚合');
  }

  // ③ 颜色五档：类型枚举、运行时属性、样式三层缺一层就是死代码。
  const t310Colors = ['primary', 'neutral', 'success', 'warning', 'danger'];
  for (const color of t310Colors) {
    if (!t310Types.tag.includes(`'${color}'`)) {
      fail(`Tag 颜色枚举缺少 ${color}`);
    }
    // 只取当前规则块（到第一个 `}` 为止），窗口跨到下一档会让它档的赋值冒充命中。
    const block = t310Styles.tag.split(`&[data-scui-color='${color}']`)[1]?.split('}')[0] ?? '';
    if (block.length === 0) {
      fail(`Tag 缺少 ${color} 的样式规则：只改属性不改样式是死代码`);
    }
    if (!block.includes('--scui-tag-accent')) {
      fail(`Tag 的 ${color} 样式没有改 --scui-tag-accent：五档配色会退化成同一色`);
    }
  }
  if (!/data-scui-color=\{color\(\)\}/.test(t310Impl.tag)) {
    fail('Tag 未恒输出 data-scui-color');
  }
  if (!/local\.color \?\? 'neutral'/.test(t310Impl.tag)) {
    fail('Tag 默认配色不是 neutral');
  }
  if (t310Impl.tag.includes('data-scui-kind') || t310Impl.tag.includes('data-scui-variant')) {
    fail('Tag 混用了 data-scui-kind / data-scui-variant：颜色语义必须走 -color');
  }

  // ④ 边框：存在即真 + 样式真的换色 + 恒占 1px（开关不抖动）。
  if (!/data-scui-bordered=\{local\.bordered === true \? '' : undefined\}/.test(t310Impl.tag)) {
    fail('Tag 的 bordered 未走存在即真口径');
  }
  if (
    !/&\[data-scui-bordered\]/.test(t310Styles.tag) ||
    !/border-color: var\(--scui-tag-accent\)/.test(t310Styles.tag)
  ) {
    fail('Tag bordered 样式未真正改边框色');
  }
  if (!/border: 1px solid transparent/.test(t310Styles.tag)) {
    fail('Tag 边框未恒占 1px：开关前后会抖动');
  }

  // ⑤ 可关闭：非受控单一出口，按钮恒带可读名称。
  if (!/<Show when=\{local\.closable === true\}>/.test(t310Impl.tag)) {
    fail('Tag 可关闭按钮未按 closable 缺席');
  }
  if (!/aria-label=\{local\.closeLabel \?\? '关闭标签'\}/.test(t310Impl.tag)) {
    fail('Tag 可关闭按钮缺少 aria-label');
  }
  if (
    !/if \(!visible\(\)\) return;/.test(t310Impl.tag) ||
    !/setVisible\(false\)/.test(t310Impl.tag) ||
    !/local\.onClose\?\.\(\)/.test(t310Impl.tag)
  ) {
    fail('Tag 关闭不是非受控单一出口：必须移除 DOM 且只发一次 onClose');
  }
  if (/visible\?:|defaultVisible|onVisibleChange/.test(t310Types.tag + t310Impl.tag)) {
    fail('Tag 引入了 visible 受控态：与 Alert 的非受控口径不一致');
  }

  // ⑥ R1 / R3 与登记表：颜色属性是「补齐登记」而非新增语义。
  for (const name of ['card', 'tag']) {
    if (t310Types[name].includes('MaybeAccessor')) {
      fail(`${name} 的函数型 prop 被 MaybeAccessor 包裹（R3）`);
    }
    if (new RegExp(`scui-${name}--`).test(t310Styles[name] + t310Impl[name])) {
      fail(`${name} 出现 modifier class（R1）`);
    }
  }
  if (!t310DataAttrs.includes('| `data-scui-color` |')) {
    fail('data-scui-color 未登记进 data-attributes.md：Button 一直在输出、登记表此前缺漏');
  }
  if (!/data-scui-loading`[^\n]*Select \/ Table \/ Card/.test(t310DataAttrs)) {
    fail('data-scui-loading 登记表未补 Card 复用');
  }
  if (!/data-scui-bordered`[^\n]*Table \/ Tag/.test(t310DataAttrs)) {
    fail('data-scui-bordered 登记表未补 Tag 复用');
  }
  if (
    !t310DataAttrs.includes('`card` / `card-cover`') ||
    !t310DataAttrs.includes('`tag` / `tag-content`')
  ) {
    fail('Card / Tag 的结构锚点未登记进 role 表');
  }

  // ⑦ 接线：barrel / 四条件 exports / catalog / Demo / 两个 SSR 入口。
  for (const name of ['card', 'tag']) {
    if (!t310Barrel.includes(`from './components/${name}'`)) {
      fail(`${name} 未进 src/index.ts barrel`);
    }
    if (!t310Pkg.includes(`"./${name}"`)) {
      fail(`${name} 缺少 package.json 四条件 exports`);
    }
    if (!t310Catalog.includes(`slug: '${name}'`)) {
      fail(`${name} 未登记进 catalog.mjs`);
    }
    if (!existsSync(join(componentsDir, name, '__tests__', 'ssr-entry.tsx'))) {
      fail(`${name} 缺少 SSR 入口文件`);
    }
    if (!t310Smoke.includes(`id: 'T3-10-${name}'`)) {
      fail(`T3-10 的 SSR 入口 ${name} 未登记进 ssr-smoke.mjs`);
    }
  }
  if (
    !/slug: 'card'[\s\S]{0,240}category: '数据'/.test(t310Catalog) ||
    !/slug: 'tag'[\s\S]{0,240}category: '数据'/.test(t310Catalog)
  ) {
    fail('Card / Tag 的 catalog 分类不是「数据」：冻结面 §2.3 归数据展示');
  }
  const t310Demos = { card: ['basic', 'cover', 'loading'], tag: ['basic', 'closable', 'bordered'] };
  for (const [name, files] of Object.entries(t310Demos)) {
    for (const file of files) {
      if (!existsSync(join(componentsDir, name, 'demos', `${file}.tsx`))) {
        fail(`${name} 缺少 Demo ${file}：§4.2 要求各 ≥3 Demo`);
      }
    }
    if (!t310Catalog.includes(`exportPath: 'solid-craft/${name}'`)) {
      fail(`${name} 缺少 catalog exportPath`);
    }
  }
}

// 4n. T3-11 标签页 / 详情列表契约（§30.45）。§4.2 验收原话「Tabs 线型 / 卡片 /
// 懒加载 / 键盘导航；Descriptions 详情页键值展示；各 ≥3 Demo + axe 0」的机器闸门。
// ① 键盘 / ARIA 零重复实现（全交给 Kobalte Tabs 原语）；② 受控优先级；
// ③ 线型 / 卡片在类型·运行时·样式三层齐全；④ 懒加载真的推迟 content 工厂调用；
// ⑤ 激活态复用 data-scui-current 且不串味；⑥ Descriptions 的 dl 语义与
// column / span / bordered 三层；⑦ barrel / exports / catalog / Demo / 两个 SSR 入口。
// 一律先剥注释再匹配（T3-04 / T3-05 的注释冒充坑），规则窗口用 split('}')[0]
// 收进当前块（T3-10 N413 / N414 的跨块假绿）。
{
  const stripT311Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const componentsDir = join(repoRoot, 'packages', 'core', 'src', 'components');
  const coreSrc = join(repoRoot, 'packages', 'core', 'src');
  const t311Impl = {
    tabs: stripT311Comments(read(join(componentsDir, 'tabs', 'Tabs.tsx'))),
    descriptions: stripT311Comments(read(join(componentsDir, 'descriptions', 'Descriptions.tsx'))),
  };
  const t311Styles = {
    tabs: stripT311Comments(read(join(componentsDir, 'tabs', 'tabs.scss'))),
    descriptions: stripT311Comments(read(join(componentsDir, 'descriptions', 'descriptions.scss'))),
  };
  const t311Types = {
    tabs: stripT311Comments(read(join(componentsDir, 'tabs', 'types.ts'))),
    descriptions: stripT311Comments(read(join(componentsDir, 'descriptions', 'types.ts'))),
  };
  const t311DataAttrs = read(
    join(repoRoot, 'packages', 'core', 'spikes', 'api-draft', 'data-attributes.md'),
  );
  const t311Smoke = read(join(repoRoot, 'packages', 'core', 'spikes', 'shared', 'ssr-smoke.mjs'));
  const t311Catalog = read(join(repoRoot, 'apps', 'docs', 'src', 'content', 'catalog.mjs'));
  const t311Barrel = read(join(coreSrc, 'index.ts'));
  const t311Pkg = read(join(repoRoot, 'packages', 'core', 'package.json'));

  // ① 键盘 / 焦点 / ARIA 只能出自 Kobalte 原语；组件层出现任一实现关键字即判红。
  if (!t311Impl.tabs.includes('@kobalte/core/tabs')) {
    fail('Tabs 未使用 Kobalte Tabs 原语：docs/02 L563 / L568 要求焦点与键盘由原语承担');
  }
  for (const token of [
    'role="tablist"',
    'role="tabpanel"',
    'role="tab"',
    'aria-selected',
    'aria-controls',
    'onKeyDown',
    'tabIndex',
    'activeElement',
    'createUniqueId',
  ]) {
    if (t311Impl.tabs.includes(token)) {
      fail(`Tabs 组件层重复实现了 ${token}：键盘 / 焦点 / ARIA 必须由 Kobalte 原语单点输出`);
    }
  }
  if (!/aria-label=\{local\['aria-label'\] \?\? '标签页'\}/.test(t311Impl.tabs)) {
    fail('Tabs 的 tablist 未恒输出可读名称：axe 会报控件无名');
  }

  // ② 受控优先级：value > 内部信号 > defaultValue > 首项；受控只通知不回写。
  if (
    !/local\.value \?\? internal\(\) \?\? local\.defaultValue \?\? firstKey\(\)/.test(t311Impl.tabs)
  ) {
    fail('Tabs 受控优先级不是 value > internal > defaultValue > firstKey');
  }
  if (
    !/if \(local\.value === undefined\) setInternal\(key\);/.test(t311Impl.tabs) ||
    !/local\.onChange\?\.\(key\);/.test(t311Impl.tabs)
  ) {
    fail('Tabs 受控时点击只发事件、不回写内部状态；或 onChange 不是单一出口');
  }
  if (!/<KobalteTabs value=\{current\(\)\} onChange=\{handleChange\}/.test(t311Impl.tabs)) {
    fail('Tabs 未把归一后的 current() 交给原语受控值');
  }

  // ③ 线型 / 卡片三层：类型枚举、运行时恒输出、样式规则真的改外观。
  for (const value of ['line', 'card']) {
    if (!t311Types.tabs.includes(`'${value}'`)) {
      fail(`Tabs 变体枚举缺少 ${value}`);
    }
    const block = t311Styles.tabs.split(`[data-scui-variant='${value}']`)[1]?.split('}')[0] ?? '';
    if (block.length === 0 || !/[a-z-]+:/.test(block)) {
      fail(`Tabs 缺少 ${value} 的真实样式规则：只改属性不改样式是死代码`);
    }
  }
  if (!/data-scui-variant=\{variant\(\)\}/.test(t311Impl.tabs)) {
    fail('Tabs 未恒输出 data-scui-variant');
  }
  if (!/local\.variant \?\? 'line'/.test(t311Impl.tabs)) {
    fail('Tabs 默认变体不是 line');
  }
  if (!/export type TabsVariant = 'line' \| 'card'/.test(t311Types.tabs)) {
    fail('Tabs 变体类型未收口成 line | card 两档');
  }
  if (
    !/\[data-scui-variant='line'\] \.scui-tabs__tab\[data-scui-current\]/.test(t311Styles.tabs) ||
    !/border-block-end-color: var\(--scui-tabs-accent\)/.test(t311Styles.tabs)
  ) {
    fail('Tabs 线型激活态未真的换边框色：只有蓝字会让线型退化成纯文字态');
  }

  // ④ 懒加载：content 是惰性工厂、forceMount 与 hidden 都由 lazy 派生。
  if (!/content\?: \(\) => JSX\.Element/.test(t311Types.tabs)) {
    fail('Tabs 的 content 不是惰性渲染工厂：懒加载会退化成「插进 DOM 后隐藏」');
  }
  if (!/\{item\.content\?\.\(\)\}/.test(t311Impl.tabs)) {
    fail('Tabs 未在原语 Content 内调用 content 工厂：节点创建没有被推迟');
  }
  if (!/const lazy = \(\): boolean => local\.lazy !== false;/.test(t311Impl.tabs)) {
    fail('Tabs 的 lazy 默认值不是 true');
  }
  if (
    !/forceMount=\{!lazy\(\)\}/.test(t311Impl.tabs) ||
    !/hidden=\{!lazy\(\) && item\.key !== current\(\)\}/.test(t311Impl.tabs)
  ) {
    fail('Tabs 懒加载未走 forceMount / hidden 单一出口：全量挂载会让多个 tabpanel 同时可见');
  }
  if (
    !/:where\(\.scui-tabs__panel\)\[hidden\]/.test(t311Styles.tabs) ||
    !/display: none/.test(t311Styles.tabs)
  ) {
    fail('Tabs 样式未把 forceMount 的非激活 panel 收起');
  }

  // ⑤ 激活态复用 -current，双通道由 Kobalte 的 aria-selected 承担。
  const currentSites = [
    ...t311Impl.tabs.matchAll(/data-scui-current=\{item\.key === current\(\) \? '' : undefined\}/g),
  ];
  if (currentSites.length !== 2) {
    fail('Tabs 的 data-scui-current 必须同时落在 Trigger 与 Content 两处');
  }
  for (const token of ['data-scui-active', 'data-scui-selected', 'data-scui-kind']) {
    if (t311Impl.tabs.includes(token)) {
      fail(`Tabs 混用了 ${token}：激活态必须复用 data-scui-current`);
    }
  }

  // ⑥ Descriptions：dl 语义、表头按内容缺席、column / span / bordered 三层。
  // 用标签起始匹配而非 `<dd `：prettier 会把多属性标签折行，`<dd` 后可能是换行。
  if (
    !/<dl[\s>]/.test(t311Impl.descriptions) ||
    !/<dt[\s>]/.test(t311Impl.descriptions) ||
    !/<dd[\s>]/.test(t311Impl.descriptions)
  ) {
    fail('Descriptions 未用原生 dl / dt / dd 承载键值：详情页不是数据表');
  }
  if (
    !/local\.title !== undefined \|\| local\.extra !== undefined/.test(t311Impl.descriptions) ||
    !/<Show when=\{hasHeader\(\)\}>/.test(t311Impl.descriptions)
  ) {
    fail('Descriptions 的 title / extra 未共用同一个可缺席表头');
  }
  if (!/data-scui-column=\{column\(\)\}/.test(t311Impl.descriptions)) {
    fail('Descriptions 未恒输出 data-scui-column：SSR 与首帧属性会不一致');
  }
  if (!/local\.column \?\? 2/.test(t311Impl.descriptions)) {
    fail('Descriptions 默认列数不是 2');
  }
  if (!/export type DescriptionsColumn = 1 \| 2 \| 3/.test(t311Types.descriptions)) {
    fail('Descriptions 列数类型未收口成 1 | 2 | 3');
  }
  for (const value of ['1', '2', '3']) {
    const block =
      t311Styles.descriptions.split(`&[data-scui-column='${value}']`)[1]?.split('}')[0] ?? '';
    if (!block.includes('--scui-descriptions-columns')) {
      fail(`Descriptions 的 column=${value} 样式没有改网格列数：三层缺一层就是死代码`);
    }
  }
  if (!/data-scui-span=\{item\.span \?\? 1\}/.test(t311Impl.descriptions)) {
    fail('Descriptions 未恒输出 data-scui-span（默认 1）');
  }
  for (const value of ['2', '3']) {
    const block =
      t311Styles.descriptions.split(`&[data-scui-span='${value}']`)[1]?.split('}')[0] ?? '';
    if (!block.includes('--scui-descriptions-span')) {
      fail(`Descriptions 的 span=${value} 样式没有改跨列变量`);
    }
  }
  if (
    !/data-scui-bordered=\{local\.bordered === true \? '' : undefined\}/.test(t311Impl.descriptions)
  ) {
    fail('Descriptions 的 bordered 未走存在即真口径');
  }
  if (!t311Styles.descriptions.includes("@use '../button/button';")) {
    fail('Descriptions 样式未聚合 Button：CSS 逐目录编译不做依赖聚合');
  }
  if (
    !/@media \(width <= 600px\)/.test(t311Styles.descriptions) ||
    !/--scui-descriptions-columns: 1/.test(t311Styles.descriptions)
  ) {
    fail('Descriptions 窄屏未强制单列：span 会在单列容器里造出隐式第二列');
  }
  if (!/grid-template-columns: 120px minmax\(0, 1fr\)/.test(t311Styles.descriptions)) {
    fail('Descriptions 的 label 列不是固定宽：按比例算会把多列下的字段名挤到折行');
  }
  const narrowBlock = t311Styles.descriptions.split('@media (width <= 600px)')[1] ?? '';
  if (!narrowBlock.includes('[data-scui-column]') || !narrowBlock.includes('[data-scui-span]')) {
    fail('Descriptions 窄屏规则未带属性选择器抬特异性：会输给列数规则，375px 仍横向溢出');
  }

  // ⑦ R1 / R3 与登记表：新增 column、补登记 span、复用 variant / current / bordered。
  for (const name of ['tabs', 'descriptions']) {
    if (t311Types[name].includes('MaybeAccessor')) {
      fail(`${name} 的函数型 prop 被 MaybeAccessor 包裹（R3）`);
    }
    if (new RegExp(`scui-${name}--`).test(t311Styles[name] + t311Impl[name])) {
      fail(`${name} 出现 modifier class（R1）`);
    }
  }
  if (!t311DataAttrs.includes('| `data-scui-column` |')) {
    fail('data-scui-column 未登记进 data-attributes.md：新增属性必须同步登记表');
  }
  if (!t311DataAttrs.includes('| `data-scui-span` |')) {
    fail('data-scui-span 未补登记：AGENTS 硬约束 3 已指派给栅格布局，登记表此前缺漏');
  }
  for (const needle of ['Pagination / Tabs', 'Skeleton / Tabs', 'Table / Tag / Descriptions']) {
    if (!t311DataAttrs.includes(needle)) {
      fail(`data-attributes.md 未补复用登记：${needle}`);
    }
  }
  if (
    !t311DataAttrs.includes('`tabs` / `tabs-list`') ||
    !t311DataAttrs.includes('`descriptions` / `descriptions-header`')
  ) {
    fail('Tabs / Descriptions 的结构锚点未登记进 role 表');
  }

  // ⑧ 接线：barrel / 四条件 exports / catalog 分类 / Demo / 两个 SSR 入口。
  for (const name of ['tabs', 'descriptions']) {
    if (!t311Barrel.includes(`from './components/${name}'`)) {
      fail(`${name} 未进 src/index.ts barrel`);
    }
    if (!t311Pkg.includes(`"./${name}"`)) {
      fail(`${name} 缺少 package.json 四条件 exports`);
    }
    if (!t311Catalog.includes(`slug: '${name}'`)) {
      fail(`${name} 未登记进 catalog.mjs`);
    }
    if (!t311Catalog.includes(`exportPath: 'solid-craft/${name}'`)) {
      fail(`${name} 缺少 catalog exportPath`);
    }
    if (!existsSync(join(componentsDir, name, '__tests__', 'ssr-entry.tsx'))) {
      fail(`${name} 缺少 SSR 入口文件`);
    }
    if (!t311Smoke.includes(`id: 'T3-11-${name}'`)) {
      fail(`T3-11 的 SSR 入口 ${name} 未登记进 ssr-smoke.mjs`);
    }
    if (!new RegExp(`slug: '${name}'[\\s\\S]{0,280}category: '数据'`).test(t311Catalog)) {
      fail(`${name} 的 catalog 分类不是「数据」：冻结面 §2.3 归数据展示`);
    }
  }
  const t311Demos = {
    tabs: ['basic', 'variant', 'lazy'],
    descriptions: ['basic', 'column', 'bordered'],
  };
  for (const [name, files] of Object.entries(t311Demos)) {
    for (const file of files) {
      if (!existsSync(join(componentsDir, name, 'demos', `${file}.tsx`))) {
        fail(`${name} 缺少 Demo ${file}：§4.2 要求各 ≥3 Demo`);
      }
    }
  }
}

// 4o. T3-12 CRUD 列表页组合契约（§30.46）。§4.2 验收原话「一页真实列表页可独立开发；
// 新增 / 编辑 / 删除 / 查询四条 E2E 全绿；axe 0 violation；SSR 入口扩到本页；视觉基线对齐」。
// 组合 Demo 落在 table/demos/ 而不是新建 catalog 条目（与 form/demos/real-form.tsx 同口径）：
// generate-docs 的双向校验与判据 11 的 AGGREGATE_SLUGS 都不为该 Demo 破例。
// 一律先剥注释再匹配；判据同时钉「接线」「静态骨架」「四条链」三层，防止只摆组件不接事件。
{
  const stripT312Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const t312Dir = join(repoRoot, 'packages', 'core', 'src', 'components', 'table');
  const t312DemoPath = join(t312Dir, 'demos', 'crud-list.tsx');
  const t312SsrPath = join(t312Dir, '__tests__', 'ssr-crud-list.tsx');
  const t312Smoke = read(join(repoRoot, 'packages', 'core', 'spikes', 'shared', 'ssr-smoke.mjs'));
  const t312Browser = read(join(repoRoot, 'tests', 'e2e', 'specs', 'browser.spec.ts'));
  const t312Catalog = read(join(repoRoot, 'apps', 'docs', 'src', 'content', 'catalog.mjs'));
  const t312Pkg = read(join(repoRoot, 'packages', 'core', 'package.json'));
  const t312Governance = read(join(repoRoot, 'scripts', 'todo-governance.json'));
  const t312Todo = read(join(repoRoot, 'docs', '08-实施Todo.md'));

  // ① 组合页在册：单点 meta、默认导出、真的跨组件引入，而不是单组件示例。
  if (!existsSync(t312DemoPath)) {
    fail('T3-12 缺少 CRUD 列表页组合 Demo：table/demos/crud-list.tsx');
  } else {
    const t312Demo = stripT312Comments(read(t312DemoPath));
    if (!/export const demo = \{[\s\S]*?title:[\s\S]*?description:/.test(t312Demo)) {
      fail('T3-12 组合 Demo 缺少 export const demo = { title, description }');
    }
    if (!/export default function CrudListDemo\(\)/.test(t312Demo)) {
      fail('T3-12 组合 Demo 缺少默认导出函数 CrudListDemo');
    }
    const importBlock = t312Demo.split("from 'solid-craft'")[0] ?? '';
    for (const symbol of [
      'Table',
      'Form',
      'Input',
      'InputNumber',
      'Select',
      'Button',
      'Modal',
      'Popconfirm',
      'Tag',
      'message',
      'useForm',
    ]) {
      if (!new RegExp(`\\b${symbol}\\b`).test(importBlock)) {
        fail(`T3-12 组合 Demo 未接入 ${symbol}：组合页必须真的跨组件，不是单组件示例`);
      }
    }

    // ② 四条业务链接线 + 全局反馈：少了任何一条就是「摆了组件但没接事件」。
    for (const [anchor, diagnosis] of [
      ['onFinish={handleQuery}', '查询链未接 Form.onFinish'],
      ['onOk={handleSubmit}', '新增 / 编辑提交未接 Modal.onOk'],
      ['onOk={() => handleDelete(row)}', '删除确认未接 Popconfirm.onOk'],
      ['onChange={handleTableChange}', '表格变更未走 Table 统一 onChange'],
      ['void message.success', '操作反馈未接 T2-06 的全局 message'],
      ['data-testid="crud-create"', '新增入口缺少 E2E 锚点'],
      ['data-testid="crud-query-submit"', '查询入口缺少 E2E 锚点'],
    ]) {
      if (!t312Demo.includes(anchor)) {
        fail(`T3-12 ${diagnosis}：源码里找不到 ${anchor}`);
      }
    }

    // ③ onChange 三参必须被真的消费，避免只写 onChange={() => {}} 的假接线。
    for (const token of ['change.pagination', 'change.sorter', 'change.filters']) {
      if (!t312Demo.includes(token)) {
        fail(`T3-12 的 Table onChange 未消费 ${token}：三参协议要在业务侧落地`);
      }
    }

    // ④ R1 / R3：组合 Demo 只消费既有组件，不新造属性、不包 MaybeAccessor。
    if (/data-scui-[a-z-]+\s*=\s*["'{]/.test(t312Demo)) {
      fail('T3-12 组合 Demo 新造了 data-scui-* 属性：页面级 Demo 只用 data-testid 锚点（R1）');
    }
    if (t312Demo.includes('MaybeAccessor')) {
      fail('T3-12 组合 Demo 出现 MaybeAccessor：函数型 prop 不得包裹（R3）');
    }
    if (/scui-[a-z]+--/.test(t312Demo)) {
      fail('T3-12 组合 Demo 出现 modifier class（R1）');
    }
  }

  // ⑤ 不新建 catalog 条目 / 不新增组件子路径：挂 table/demos 才不触发双向校验破例。
  if (t312Catalog.includes("slug: 'crud-list'")) {
    fail('T3-12 不该新增独立 catalog 条目：应复用 table/demos 落点（方案 A）');
  }
  if (t312Pkg.includes('"./crud-list"')) {
    fail('T3-12 不该新增组件子路径 exports：组合 Demo 不是新组件');
  }

  // ⑥ SSR：独立静态骨架 + 在册 + 弹层 counts 锁 0，且不直接渲染 Demo 文件。
  if (!existsSync(t312SsrPath)) {
    fail('T3-12 缺少 SSR 入口 table/__tests__/ssr-crud-list.tsx');
  } else {
    const t312Ssr = stripT312Comments(read(t312SsrPath));
    if (t312Ssr.includes('demos/crud-list')) {
      fail('T3-12 的 SSR 入口直接渲染了交互 Demo：Portal 与全局 message 会破坏双渲确定性');
    }
    if (t312Ssr.includes('<Modal') || t312Ssr.includes('<Popconfirm')) {
      fail('T3-12 的 SSR 入口挂了弹层组件：Portal 只在客户端 onMount 后挂载');
    }
    // 源码层只能验「真的用了这些组件」；data-scui-role 是渲染输出，由下面
    // ssr-smoke 的 markers 契约 + 实跑双渲钉住，不在源码里找字符串冒充判据。
    for (const token of [
      'data-testid="crud-ssr-page"',
      '<Form',
      '<Table',
      'aria-label="计划查询"',
      'aria-label="维简设备采购计划列表"',
      'aria-label="采购计划表单"',
    ]) {
      if (!t312Ssr.includes(token)) {
        fail(`T3-12 的 SSR 静态骨架缺少 ${token}`);
      }
    }
  }
  if (!t312Smoke.includes("id: 'T3-12'")) {
    fail('T3-12 的 SSR 入口未登记进 ssr-smoke.mjs（建了入口却没跑等于没有）');
  }
  if (!t312Smoke.includes("file: '/src/components/table/__tests__/ssr-crud-list.tsx'")) {
    fail('T3-12 的 SSR 入口登记路径不对');
  }
  const t312Case = t312Smoke.split("id: 'T3-12'")[1]?.split('  },\n')[0] ?? '';
  for (const marker of [
    'data-scui-role="form"',
    'data-scui-role="form-item"',
    'data-scui-role="table-root"',
    'data-scui-role="table-footer"',
  ]) {
    if (!t312Case.includes(marker)) {
      fail(`T3-12 的 SSR markers 未覆盖渲染契约 ${marker}：入口建了但没验静态骨架`);
    }
  }
  for (const lock of [
    `['data-scui-role="modal"', 0]`,
    `['data-scui-role="popconfirm-trigger"', 0]`,
  ]) {
    if (!t312Smoke.includes(lock)) {
      fail('T3-12 的 SSR counts 未锁 0：Modal / Popconfirm 的 Portal 服务端零输出');
    }
  }

  // ⑦ 生成物与视觉基线在册（判据 11 自动反算，这里点名两条固定产物）。
  for (const file of [
    join(repoRoot, 'apps', 'docs', 'src', 'generated', 'demos', 'table-crud-list.json'),
    join(repoRoot, 'apps', 'docs', 'public', 'llms', 'demos', 'table-crud-list.md'),
  ]) {
    if (!existsSync(file)) {
      fail(`T3-12 缺少生成物 ${file}：新增 Demo 必须跑 pnpm docs:generate`);
    }
  }
  for (const width of [1280, 768]) {
    if (
      !existsSync(
        join(
          repoRoot,
          'tests',
          'e2e',
          'baselines',
          `light-ltr-default-table-crud-list-${width}.png`,
        ),
      )
    ) {
      fail(`T3-12 缺少 ${width}px 视觉基线：新增 Demo 须跑 pnpm test:visual:update`);
    }
  }

  // ⑧ 四条 E2E 链与 axe 组合用例在册；375px 与 Demo axe 循环由 DEMO_CASES 自动覆盖。
  for (const label of ['CRUD 查询', 'CRUD 新增', 'CRUD 编辑', 'CRUD 删除']) {
    if (!t312Browser.includes(label)) {
      fail(`T3-12 缺少手写 E2E 用例：${label}`);
    }
  }
  if (!t312Browser.includes('CRUD 列表页无 serious / critical 违规')) {
    fail('T3-12 缺少弹层打开态的 axe 组合用例');
  }

  // ⑨ 治理闭环：evidence / 落地记录 / 勾 [x] 三者同步（check:todo 已覆盖，这里呼应）。
  if (!/"T3-12": "30\.46"/.test(t312Governance)) {
    fail('T3-12 勾了 [x] 但 todo-governance.json 没有 evidence 30.46');
  }
  // 按标题行精确识别：§30.46 判据表里也写着 `### 30.46` 字面量，
  // 用 includes 全文搜会被表格文字冒充（T3-04 / T3-05 的注释冒充坑同源）。
  const t312Sections = t312Todo.split('\n').filter((line) => line.startsWith('### 30.46 '));
  if (t312Sections.length !== 1) {
    fail('T3-12 缺少 docs/08 §30.46 落地记录');
  }
  const t312Row = t312Todo.split('\n').find((line) => line.startsWith('| T3-12 |')) ?? '';
  if (!t312Row.includes('[x]')) {
    fail('T3-12 的 §4.2 主行尚未勾 [x]');
  }
}

// 4p. T3-13 Upload 上传契约（§30.47）。§4.2 验收原话「上传 / 删除 / 重试受控链路；
// SSR 静态骨架；零新增依赖；与 Form.Item 接入可用」。Kobalte 没有 Upload 原语，
// 拖拽库 v1.0 才引入，所以判据同时钉「零自研传输」「零新依赖」「静态骨架」三层，
// 防止只摆一个文件 input 就冒充上传组件。一律先剥注释再匹配。
{
  const stripT313Comments = (code) =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const t313Dir = join(repoRoot, 'packages', 'core', 'src', 'components', 'upload');
  const t313Impl = stripT313Comments(read(join(t313Dir, 'Upload.tsx')));
  const t313Types = stripT313Comments(read(join(t313Dir, 'types.ts')));
  const t313Scss = stripT313Comments(read(join(t313Dir, 'upload.scss')));
  const t313Test = stripT313Comments(read(join(t313Dir, 'Upload.test.tsx')));
  const t313Ssr = stripT313Comments(read(join(t313Dir, '__tests__', 'ssr-entry.tsx')));
  const t313Smoke = read(join(repoRoot, 'packages', 'core', 'spikes', 'shared', 'ssr-smoke.mjs'));
  const t313Browser = read(join(repoRoot, 'tests', 'e2e', 'specs', 'browser.spec.ts'));
  const t313Catalog = read(join(repoRoot, 'apps', 'docs', 'src', 'content', 'catalog.mjs'));
  const t313Pkg = read(join(repoRoot, 'packages', 'core', 'package.json'));
  const t313Barrel = read(join(repoRoot, 'packages', 'core', 'src', 'index.ts'));
  const t313Attrs = read(
    join(repoRoot, 'packages', 'core', 'spikes', 'api-draft', 'data-attributes.md'),
  );
  const t313Governance = read(join(repoRoot, 'scripts', 'todo-governance.json'));
  const t313Todo = read(join(repoRoot, 'docs', '08-实施Todo.md'));

  // ① 纵向切片齐全：7 类文件 + 3 个 Demo，每个 Demo 都带 meta 与默认导出。
  const t313Files = [
    'types.ts',
    'Upload.tsx',
    'upload.scss',
    'index.ts',
    'Upload.test.tsx',
    '__tests__/ssr-entry.tsx',
    'demos/basic.tsx',
    'demos/progress.tsx',
    'demos/form.tsx',
  ];
  for (const file of t313Files) {
    if (!existsSync(join(t313Dir, file))) {
      fail(`T3-13 缺少 Upload 纵向切片文件 ${file}`);
    }
  }
  for (const slug of ['basic', 'progress', 'form']) {
    const source = stripT313Comments(read(join(t313Dir, 'demos', `${slug}.tsx`)));
    if (!/export const demo = \{[\s\S]*?title:[\s\S]*?description:/.test(source)) {
      fail(`T3-13 的 Demo ${slug} 缺少 export const demo = { title, description }`);
    }
    if (!/export default function Upload\w+Demo\(\)/.test(source)) {
      fail(`T3-13 的 Demo ${slug} 缺少默认导出组件`);
    }
  }

  // ② 五链接线 + 状态机：customRequest 的四个回调、删除 / 取消 / 重试、
  // 上传前校验与拖拽入口，全部必须真的出现在实现代码里。
  for (const anchor of [
    'customRequest',
    'onProgress',
    'onSuccess',
    'onError',
    'signal: controller.signal',
    'new AbortController()',
    'beforeUpload',
    'maxSize',
    'maxCount',
    'matchesAccept',
    'handleDragOver',
    'handleDrop',
    'const remove = ',
    'const cancel = ',
    'const retry = ',
    'data-scui-role="upload-progress"',
    'data-scui-role="upload-retry"',
    'data-scui-role="upload-cancel"',
    'data-scui-role="upload-remove"',
  ]) {
    if (!t313Impl.includes(anchor)) {
      fail(`T3-13 Upload 缺少上传链路接线 ${anchor}：入口建了但没真的接上`);
    }
  }

  // ③ 值优先级与单一出口：Form 字段 > fileList > 内部副本；所有变更只走 emit。
  for (const anchor of [
    'useFormFieldOptional()',
    'const list = (): UploadFile[] => {',
    'if (field) return toFileList(field.value());',
    'return local.fileList ?? internal();',
    'function toFileList(value: unknown): UploadFile[] {',
    'const emit = (next: UploadFile[], file: UploadFile): void => {',
    'setInternal(next);',
    'field?.setValue(next);',
    'local.onChange?.(next, info);',
  ]) {
    if (!t313Impl.includes(anchor)) {
      fail(`T3-13 Upload 的受控值桥缺少 ${anchor}`);
    }
  }
  if (/fetch\(|XMLHttpRequest|@kobalte\/core\/upload/.test(t313Impl)) {
    fail('T3-13 Upload 组件内不得自研传输实现或引入 Kobalte Upload 原语');
  }

  // ④ R1 / 新增属性登记：四个状态属性三层齐全，且不得出现 modifier class。
  for (const attr of [
    'data-scui-status',
    'data-scui-dragging',
    'data-scui-invalid',
    'data-scui-disabled',
  ]) {
    if (!t313Impl.includes(attr)) {
      fail(`T3-13 Upload 实现未输出 ${attr}`);
    }
    if (!t313Scss.includes(attr)) {
      fail(`T3-13 Upload 样式未消费 ${attr}`);
    }
  }
  for (const attr of ['data-scui-status', 'data-scui-dragging']) {
    if (!t313Attrs.includes(`| \`${attr}\``)) {
      fail(`T3-13 新增属性 ${attr} 未登记进 data-attributes.md`);
    }
  }
  if (/scui-upload--/.test(t313Impl) || /scui-upload--/.test(t313Scss)) {
    fail('T3-13 Upload 出现 modifier class，违反 R1');
  }
  if (t313Types.includes('MaybeAccessor') || t313Impl.includes('MaybeAccessor')) {
    fail('T3-13 Upload 用 MaybeAccessor 包裹函数型 prop，违反 R3');
  }

  // ⑤ 零新增依赖 + 公共出口：四条件 exports、barrel、catalog 三条同时在册。
  for (const condition of ['types', 'solid', 'import', 'default']) {
    if (
      !t313Pkg.includes(`"./upload"`) ||
      !t313Pkg.includes(
        `./dist/${condition === 'types' ? 'types' : condition === 'solid' ? 'source' : 'esm'}/components/upload/`,
      )
    ) {
      fail(`T3-13 的 package.json ./upload 缺少 ${condition} 条件`);
    }
  }
  if (!t313Barrel.includes("export { Upload } from './components/upload';")) {
    fail('T3-13 根 barrel 未导出 Upload');
  }
  if (!t313Catalog.includes("slug: 'upload'")) {
    fail('T3-13 缺少 catalog 条目 slug: upload');
  }

  // ⑥ Form.Item 接入：字段上下文真的接管 value / aria / ids，而不是只写个 Demo。
  for (const anchor of ['field?.ids.control', "aria()?.['aria-labelledby']", 'field?.disabled()']) {
    if (!t313Impl.includes(anchor)) {
      fail(`T3-13 Upload 与 Form.Item 的接线缺少 ${anchor}`);
    }
  }
  // 用正则词边界而不是 includes('<Form.Item')：后者会被 <Form.ItemX 冒充
  // （负向 N666 实测把标签改坏仍判绿，判据本身也是实证对象）。
  const t313FormDemo = read(join(t313Dir, 'demos', 'form.tsx'));
  if (!/<Form\.Item[\s>]/.test(t313FormDemo) || !t313FormDemo.includes('</Form.Item>')) {
    fail('T3-13 的 form Demo 没有真的把 Upload 放进 Form.Item');
  }

  // ⑦ SSR 静态骨架：独立入口、不 import 交互 Demo、ssr-smoke 登记与渲染契约。
  if (t313Ssr.includes('demos/')) {
    fail('T3-13 SSR 入口不得 import 交互 Demo');
  }
  for (const anchor of ['defaultFileList={files}', 'disabled', 'data-testid="upload-ssr-page"']) {
    if (!t313Ssr.includes(anchor)) {
      fail(`T3-13 SSR 入口缺少静态骨架 ${anchor}`);
    }
  }
  if (!t313Smoke.includes("id: 'T3-13'")) {
    fail('T3-13 缺少 ssr-smoke 登记');
  }
  if (!t313Smoke.includes("file: '/src/components/upload/__tests__/ssr-entry.tsx'")) {
    fail('T3-13 的 ssr-smoke 文件路径不对');
  }
  const t313Case = t313Smoke.split("id: 'T3-13'")[1]?.split('  },\n')[0] ?? '';
  for (const marker of [
    'data-scui-role="upload"',
    'data-scui-role="upload-input"',
    'data-scui-role="upload-item"',
    'data-scui-role="upload-progress"',
    'data-scui-role="upload-error"',
    'data-scui-status="uploading"',
    'data-scui-invalid="false"',
  ]) {
    if (!t313Case.includes(marker)) {
      fail(`T3-13 的 SSR markers 未覆盖渲染契约 ${marker}`);
    }
  }
  for (const lock of [
    '[\'data-scui-role="upload"\', 2]',
    '[\'data-scui-role="upload-item"\', 4]',
    '[\'data-scui-role="upload-progress"\', 1]',
  ]) {
    if (!t313Smoke.includes(lock)) {
      fail(`T3-13 的 SSR counts 未钉住 ${lock}`);
    }
  }

  // ⑧ 单测与 E2E：五条手写链 + axe 组合用例在册，判据不靠「文件存在」假绿。
  for (const label of [
    '受控 fileList 时删除只发 onChange',
    '选择文件后进度 / 成功真的改写状态',
    'onError 转入 error 并露出可读文案',
    '取消先 abort 再转 error',
    '重试重新调用 customRequest',
    'Form.Item 接管 fileList',
  ]) {
    if (!t313Test.includes(label)) {
      fail(`T3-13 单测缺少用例 ${label}`);
    }
  }
  for (const label of [
    'Upload 受控：点击删除只发事件，列表不自行回弹',
    'Upload 进度：customRequest 回调把状态推到 done',
    'Upload 失败与重试：error 项点重试重跑同一条链路',
    'Upload 取消与删除：abort 后转 error，删除真的移除列表项',
    'Upload 表单接入：提交拿到 fileList，删空后必填校验生效',
    'Upload 三个 Demo 无 serious / critical 违规',
  ]) {
    if (!t313Browser.includes(label)) {
      fail(`T3-13 缺少 E2E 用例 ${label}`);
    }
  }

  // ⑨ 生成物 / 视觉基线在册（整份删除由负向实证覆盖）。
  for (const generated of [
    join(repoRoot, 'apps', 'docs', 'src', 'generated', 'demos', 'upload-basic.json'),
    join(repoRoot, 'apps', 'docs', 'public', 'llms', 'demos', 'upload-progress.md'),
    join(repoRoot, 'tests', 'e2e', 'baselines', 'light-ltr-default-upload-form-1280.png'),
  ]) {
    if (!existsSync(generated)) {
      fail(`T3-13 缺少生成物或视觉基线 ${generated}`);
    }
  }

  // ⑩ 治理闭环：evidence / 落地记录 / 勾 [x] 三者同步。
  if (!/"T3-13": "30\.47"/.test(t313Governance)) {
    fail('T3-13 勾了 [x] 但 todo-governance.json 没有 evidence 30.47');
  }
  const t313Sections = t313Todo.split('\n').filter((line) => line.startsWith('### 30.47 '));
  if (t313Sections.length !== 1) {
    fail('T3-13 缺少 docs/08 §30.47 落地记录');
  }
  const t313Row = t313Todo.split('\n').find((line) => line.startsWith('| T3-13 |')) ?? '';
  if (!t313Row.includes('[x]')) {
    fail('T3-13 的 §4.2 主行尚未勾 [x]');
  }
}

// 4b. 视觉基线防漂移（docs/08 §30.8）：统一浏览器 build，禁止改回系统 Chrome / 放宽阈值
const playwrightConfig = read(join(repoRoot, 'playwright.config.ts'));
if (playwrightConfig.length === 0) {
  fail('缺少 playwright.config.ts');
} else {
  if (playwrightConfig.includes('PLAYWRIGHT_USE_BUNDLED')) {
    fail('playwright.config.ts 仍含已废弃的 PLAYWRIGHT_USE_BUNDLED（默认必须 bundled chromium）');
  }
  if (!playwrightConfig.includes('PLAYWRIGHT_USE_SYSTEM_CHROME')) {
    fail('playwright.config.ts 缺少 PLAYWRIGHT_USE_SYSTEM_CHROME 本地逃生舱');
  }
  if (
    !/\.\.\.\(useSystemChrome \? \{ channel: 'chrome' \} : \{ channel: 'chromium' \}\)/.test(
      playwrightConfig,
    )
  ) {
    fail('playwright.config.ts 未把 bundled chromium 设为默认、系统 Chrome 未条件化（会重新漂移）');
  }
  // 只看 expect.toHaveScreenshot 配置块：注释里出现同名字符串不得冒充已配置（N15 同型盲区）
  const screenshotBlock = playwrightConfig.match(/toHaveScreenshot:\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  if (screenshotBlock.length === 0) {
    fail('playwright.config.ts 缺少 expect.toHaveScreenshot 配置块');
  }
  if (!/maxDiffPixelRatio:\s*0\.002/.test(screenshotBlock)) {
    fail('maxDiffPixelRatio 被放宽：应统一浏览器 build，而不是放水视觉阈值');
  }
  if (!/animations:\s*'disabled'/.test(screenshotBlock)) {
    fail('toHaveScreenshot 未禁用动画');
  }
}

// 5. 工具链单点
if (!String(rootPkg.scripts?.size ?? '').includes('size-limit')) {
  fail('根 size 脚本未使用 size-limit（06 §12 要求 CI 运行 size-limit）');
}
const sizeLimit = rootPkg.devDependencies?.['size-limit'];
const filePlugin = rootPkg.devDependencies?.['@size-limit/file'];
if (!sizeLimit) fail('devDependencies 缺少 size-limit');
if (!filePlugin) fail('devDependencies 缺少 @size-limit/file（file 插件才能算 gzip 文件体积）');
if (sizeLimit && filePlugin && sizeLimit !== filePlugin) {
  fail(`size-limit@${sizeLimit} 与 @size-limit/file@${filePlugin} 版本不一致`);
}

// 6. T1-11 受控发布通道契约：全 workflow 扫描，杜绝「新增一个 yml 就绕过门禁」
const workflowFiles = existsSync(workflowsDir)
  ? readdirSync(workflowsDir)
      .filter((file) => /\.ya?ml$/.test(file))
      .toSorted()
  : [];
for (const file of workflowFiles) {
  const text = read(join(workflowsDir, file));
  if (/NPM_TOKEN|NODE_AUTH_TOKEN|_authToken/.test(text)) {
    fail(`${file} 出现发布凭据字面量：T1-11 通道只允许 OIDC 短期凭据`);
  }
  if (/\bnpm publish\b|changeset publish/.test(text)) {
    fail(`${file} 出现直接发布命令：T1-11 通道只允许把包提交到暂存队列`);
  }
  for (const match of text.matchAll(/registry-url:\s*['"]?([^'"\s]+)/g)) {
    if (match[1] !== 'https://registry.npmjs.org/') {
      fail(`${file} 的 registry-url 不是公开 npmjs.org：${match[1]}`);
    }
  }
}
const releaseWorkflow = read(join(workflowsDir, 'release.yml'));
if (releaseWorkflow.length === 0) {
  fail('缺少 .github/workflows/release.yml（T1-11 受控发布通道）');
} else {
  if (!/workflow_dispatch:/.test(releaseWorkflow)) {
    fail('release.yml 未限制为 workflow_dispatch 手动触发');
  }
  if (/^\s*push:/m.test(releaseWorkflow) || /^\s*pull_request:/m.test(releaseWorkflow)) {
    fail('release.yml 含 push / pull_request 触发：代码合并不得自动发包');
  }
  if (!/environment:\s*\S+/.test(releaseWorkflow)) {
    fail('release.yml 缺少 environment 人工审批');
  }
  if (!/id-token:\s*write/.test(releaseWorkflow)) {
    fail('release.yml 缺少 id-token: write（OIDC 短期凭据）');
  }
  if (!releaseWorkflow.includes('pnpm stage:release')) {
    fail('release.yml 未指向 pnpm stage:release');
  }
}

// 8. 视觉基线字体契约（docs/08 §30.9 方案 B）：Demo 宿主固定仓库内 Web 字体
const FONT_SHA256 = '75f2c86ae8ae7b68779e3174fc5575a6ba136d4859dedabd05edabead9616406';
const fontsDir = join(repoRoot, 'apps', 'docs', 'public', 'fonts');
const fontFile = join(fontsDir, 'scui-visual.woff2');
const charsetFile = join(fontsDir, 'charset.txt');
const oflFile = join(fontsDir, 'OFL.txt');
const docsBaseCss = read(join(repoRoot, 'apps', 'docs', 'src', 'styles', 'base.css'));

if (!existsSync(fontFile)) {
  fail('缺少仓库内固定字体 apps/docs/public/fonts/scui-visual.woff2');
} else {
  const fontHash = createHash('sha256').update(readFileSync(fontFile)).digest('hex');
  if (fontHash !== FONT_SHA256) {
    fail(
      `固定字体 SHA256=${fontHash} 与判据不符：重跑 build-visual-font.py 后须同步更新 FONT_SHA256 并重生成全部视觉基线`,
    );
  }
}
if (!/SIL OPEN FONT LICENSE Version 1\.1/.test(read(oflFile))) {
  fail('缺少字体许可证全文 apps/docs/public/fonts/OFL.txt（OFL-1.1）');
}
const fontScriptPath = join(repoRoot, 'scripts', 'build-visual-font.py');
if (!existsSync(fontScriptPath)) {
  fail('缺少可复现的字体子集生成脚本 scripts/build-visual-font.py');
} else {
  // 注释里写同样的字面量也不算数（与判据 4p 的剥注释口径一致）
  const fontScriptCode = read(fontScriptPath).replace(/#[^\n]*/g, '');
  if (!/font\.recalcTimestamp\s*=\s*False/.test(fontScriptCode)) {
    fail('字体生成脚本未关闭 head 时间戳重算：同一字集重复重建会产出不同字节');
  }
}

// 先剥离 CSS 注释，再解析真实配置块：注释里写完整 @font-face 也不得冒充
// （N15 / N26 / N37 同型盲区）
const baseCssCode = docsBaseCss.replace(/\/\*[\s\S]*?\*\//g, '');
const fontFaceBlock = baseCssCode.match(/@font-face\s*\{([\s\S]*?)\}/)?.[1] ?? '';
if (fontFaceBlock.length === 0) fail('base.css 缺少 @font-face 配置块');
if (!/font-family:\s*['"]SCUI Visual['"]/.test(fontFaceBlock)) {
  fail('@font-face 未声明 SCUI Visual 字体族');
}
if (
  !/src:\s*url\(['"]?\/fonts\/scui-visual\.woff2['"]?\)\s*format\(['"]woff2['"]\)/.test(
    fontFaceBlock,
  )
) {
  fail('@font-face 的 src 未指向仓库内 /fonts/scui-visual.woff2（禁止 CDN / 系统字体）');
}
if (!/font-weight:\s*100\s+900/.test(fontFaceBlock)) {
  fail('@font-face 未声明可变字重 100 900（标题 font-weight:600 会退化为合成粗体）');
}
if (!/font-display:\s*block/.test(fontFaceBlock)) {
  fail('@font-face 未设 font-display:block（字体未就绪就截图会退回系统字体）');
}
const demoRootBlock = baseCssCode.match(/\.demo-root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
if (demoRootBlock.length === 0) fail('base.css 缺少 .demo-root 配置块');
if (!/font-family:\s*['"]SCUI Visual['"],\s*sans-serif/.test(demoRootBlock)) {
  fail('.demo-root 未把 SCUI Visual 设为首选字体');
}
if (
  /PingFang|Microsoft YaHei|Hiragino|Songti|Heiti|system-ui|-apple-system|Arial|Helvetica/i.test(
    demoRootBlock,
  )
) {
  fail('.demo-root 出现系统字体回退：runner 字体集会重新参与截图比对');
}
// 字集口径与 build-visual-font.py 一致：整个 docs 源码树，覆盖 Demo 内容 / 组件标题 /
// 宿主固定文案 / 注释。只扫 demos/*.json 会漏掉 standalone 的「· 固定字体」等字形，
// 那些字符会悄悄回退系统字体，runner 字体集再次参与比对（CDP 实测已复现）。
const docsSrcTextFile = /\.(?:ts|tsx|css|scss|json|md|html|js|mjs)$/;
const walkDocsSrc = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const abs = join(dir, entry.name);
        if (entry.isDirectory()) return walkDocsSrc(abs);
        return docsSrcTextFile.test(entry.name) ? [abs] : [];
      })
    : [];
const docsSrcFiles = walkDocsSrc(join(repoRoot, 'apps', 'docs', 'src'));
if (docsSrcFiles.length < 10) fail('apps/docs/src 源文件过少，字集判据可能失效');
// 与 build-visual-font.py 的 renderable() 逐条一致：变体选择符 / 零宽 / 组合符不单独成字形
const isRenderable = (cp) => {
  if (cp <= 0x7f) return false;
  if (cp >= 0xfe00 && cp <= 0xfe0f) return false;
  if (cp >= 0x1f3fb && cp <= 0x1f3ff) return false;
  if ([0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2060, 0xfeff, 0x00ad].includes(cp)) {
    return false;
  }
  if (cp >= 0x0300 && cp <= 0x036f) return false;
  return true;
};
const renderedChars = new Set();
for (const abs of docsSrcFiles) {
  for (const char of read(abs)) {
    if (isRenderable(char.codePointAt(0) ?? 0)) renderedChars.add(char);
  }
}
if (renderedChars.size === 0) fail('未从 docs 源码扫描到任何非 ASCII 字符（字集判据失效）');
// 按码位数值排序：与 build-visual-font.py 的 sorted() 一致（UTF-16 码元序会在 astral 字符上分叉）
const compareChars = (a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0);
if (read(charsetFile).trim() !== [...renderedChars].toSorted(compareChars).join('')) {
  fail(
    'charset.txt 与 apps/docs/src 源码字集不一致：新增汉字/标点须重跑 build-visual-font.py 并重生成全部视觉基线',
  );
}

// ---------------------------------------------------------------------------
// 9. Phase 0 Spike 契约：四个 Spike 必须真有产物、真能 SSR、且真的不进发布包
// ---------------------------------------------------------------------------
const coreDir = join(repoRoot, 'packages', 'core');
const spikesRoot = join(coreDir, 'spikes');
const spikeCases = [
  { id: 'S-02', dir: 's02-kobalte', tests: ['s02.test.tsx'], draft: 'Select.md' },
  { id: 'S-04', dir: 's04-table', tests: ['s04.test.tsx'], draft: 'Table.md' },
  {
    id: 'S-05',
    dir: 's05-date-picker',
    tests: ['s05.test.tsx', 'hydration.test.tsx'],
    draft: 'DatePicker.md',
  },
  { id: 'S-06', dir: 's06-form', tests: ['s06.test.tsx'], draft: 'Form.md' },
];
for (const item of spikeCases) {
  const dir = join(spikesRoot, item.dir);
  if (!existsSync(dir)) fail(`${item.id} 缺少 Spike 目录 spikes/${item.dir}/`);
  for (const test of item.tests) {
    if (!existsSync(join(dir, test))) fail(`${item.id} 缺少客户端实证 ${test}`);
  }
  if (!existsSync(join(dir, 'ssr.tsx'))) fail(`${item.id} 缺少 SSR 入口 ssr.tsx`);
  const draft = read(join(spikesRoot, 'api-draft', item.draft));
  if (!draft.includes('## 9. 评审结论')) {
    fail(`${item.id} 的 API 草案 ${item.draft} 未按统一模板写满 9 节`);
  }
}
const draftFiles = [
  'TEMPLATE.md',
  'REVIEW.md',
  'data-attributes.md',
  'Select.md',
  'Table.md',
  'DatePicker.md',
  'Form.md',
];
for (const name of draftFiles) {
  if (!existsSync(join(spikesRoot, 'api-draft', name))) {
    fail(`T0-03 评审材料缺失：api-draft/${name}`);
  }
}
const reviewText = read(join(spikesRoot, 'api-draft', 'REVIEW.md'));
if (!reviewText.includes('不得代填')) {
  fail('REVIEW.md 必须保留「AI 不得自行裁决 / 不得代填评审结论」声明');
}
// 签字前结论栏必须全空；签字后必须全填满且评审人为 Aming。
// 与 check-decisions.mjs 的方案 C 守卫同口径，避免两条门禁在签字态互斥。
const phase0Decisions = JSON.parse(read(join(repoRoot, 'scripts', 'phase0-decisions.json')));
const reviewSigned = phase0Decisions.gate?.reviewSigned;
if (reviewSigned === false) {
  if (!reviewText.includes('（待填）')) {
    fail('T0-03 未签字：REVIEW.md 结论栏必须全部保持「（待填）」，禁止 AI 代签');
  }
} else if (reviewSigned === true) {
  if (reviewText.includes('（待填）')) {
    fail('T0-03 已签字：REVIEW.md 仍残留「（待填）」结论栏');
  }
  if (!/^\| 评审人 \| Aming \|$/m.test(reviewText)) {
    fail('T0-03 已签字：REVIEW.md 的评审人必须为 Aming（AI 不得代签）');
  }
} else {
  fail('gate.reviewSigned 必须是显式布尔值');
}
const spikeCss = read(join(spikesRoot, 'spikes.css'));
if (!/\[data-[\w-]+\]/.test(spikeCss) || !spikeCss.includes(':focus-visible')) {
  fail('spikes.css 缺少 [data-*] 状态选择器或 :focus-visible 焦点规则');
}
const corePkgJson = JSON.parse(read(join(coreDir, 'package.json')));
const coreFiles = corePkgJson.files ?? [];
if (coreFiles.some((entry) => String(entry).includes('spikes'))) {
  fail('packages/core/package.json#files 含 spikes/（预研产物不得进 npm 包）');
}
if (Object.keys(corePkgJson.exports ?? {}).some((key) => key.includes('spikes'))) {
  fail('packages/core exports 含 spikes 子路径（预研产物不得对外导出）');
}
const coreVitestConfig = read(join(coreDir, 'vitest.config.mjs'));
if (!coreVitestConfig.includes('spikes/**/*.test')) {
  fail('vitest include 未包含 spikes/**/*.test（Spike 客户端实证不会自动跑）');
}
const ssrSmoke = join(spikesRoot, 'shared', 'ssr-smoke.mjs');
if (!existsSync(ssrSmoke)) {
  fail('缺少 spikes/shared/ssr-smoke.mjs');
} else {
  const result = spawnSync(process.execPath, [ssrSmoke], {
    cwd: coreDir,
    encoding: 'utf8',
    timeout: 180_000,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status !== 0 || !output.includes('[spikes:ssr] PASS')) {
    fail(
      `Spike SSR 冒烟未通过（rc=${result.status}，${result.error?.message ?? '无异常'}）：${output.trim().slice(-400)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// 11. M2 Exit 覆盖契约（T2-13，docs/08 §30.31）
// ---------------------------------------------------------------------------
// 三条判据分工：组件"有没有 3 个 Demo"（产出面）、"每个 Demo 有没有截图"（覆盖面对齐）、
// "用例是不是真的按 demo 跑"（判据自身不被写死回去）。缺任一条，「视觉回归全绿」
// 都可能只是覆盖了一部分页面。
const catalogPath = join(repoRoot, 'apps', 'docs', 'src', 'generated', 'catalog.json');
const catalog = JSON.parse(read(catalogPath) || '{}');
const catalogComponents = Array.isArray(catalog.components) ? catalog.components : [];
const demoCoverage = { components: 0, demos: 0, baselines: 0 };
const MIN_DEMOS = 3;
// overview 是首页聚合预览（把多个组件拼在一页），不是组件本身，豁免 ≥3 判据；
// 它仍参与截图 / axe，因此不豁免基线覆盖判据。
const AGGREGATE_SLUGS = new Set(['overview']);
// 与 tests/e2e/specs/visual.spec.ts 的 VIEWPORTS 同一份口径（06 §5.3：MVP 只跑 1280 / 768）
const SCREENSHOT_WIDTHS = [1280, 768];

if (catalogComponents.length === 0) {
  fail('无法解析 catalog.json 的 components：Demo 覆盖判据会空转（先跑 pnpm docs:generate）');
} else {
  demoCoverage.components = catalogComponents.length;
  demoCoverage.demos = catalogComponents.reduce(
    (sum, component) => sum + (Array.isArray(component.demos) ? component.demos.length : 0),
    0,
  );
  const thin = catalogComponents
    .filter((component) => !AGGREGATE_SLUGS.has(component.slug))
    .map((component) => ({
      slug: component.slug,
      count: Array.isArray(component.demos) ? component.demos.length : 0,
    }))
    .filter((item) => item.count < MIN_DEMOS);
  if (thin.length > 0) {
    fail(
      `以下组件 Demo 少于 ${MIN_DEMOS} 个（docs/04 §3.3：P0 组件每个至少 3 个 Demo）：${thin
        .map((item) => `${item.slug}=${item.count}`)
        .join(', ')}`,
    );
  }

  const expectedBaselines = new Set(
    catalogComponents.flatMap((component) =>
      (Array.isArray(component.demos) ? component.demos : []).flatMap((demo) =>
        SCREENSHOT_WIDTHS.map(
          (width) => `light-ltr-default-${component.slug}-${demo.name}-${width}.png`,
        ),
      ),
    ),
  );
  const baselineDir = join(repoRoot, 'tests', 'e2e', 'baselines');
  const actualBaselines = existsSync(baselineDir)
    ? readdirSync(baselineDir).filter((file) => file.endsWith('.png'))
    : [];
  if (actualBaselines.length === 0) {
    fail('tests/e2e/baselines 为空：视觉基线全量缺失');
  }
  demoCoverage.baselines = actualBaselines.length;
  const missingBaselines = [...expectedBaselines].filter((file) => !actualBaselines.includes(file));
  if (missingBaselines.length > 0) {
    fail(
      `视觉基线缺失 ${missingBaselines.length} 张（新增 Demo 必须跑 pnpm test:visual:update）：${missingBaselines
        .slice(0, 4)
        .join(', ')}`,
    );
  }
  const staleBaselines = actualBaselines.filter((file) => !expectedBaselines.has(file));
  if (staleBaselines.length > 0) {
    fail(
      `视觉基线多出 ${staleBaselines.length} 张（Demo 已删除 / 改名但基线没清）：${staleBaselines
        .slice(0, 4)
        .join(', ')}`,
    );
  }

  // 用例必须按 DEMO_CASES 循环：写回 DEMO_IDS（只按组件）会让新增 Demo 的截图
  // 与 axe 扫描悄悄消失，而上面两条判据仍然全绿。
  for (const spec of ['visual.spec.ts', 'browser.spec.ts']) {
    const code = read(join(repoRoot, 'tests', 'e2e', 'specs', spec));
    if (!code.includes('DEMO_CASES')) {
      fail(`${spec} 未按 DEMO_CASES 循环：新增 Demo 不会自动进入截图 / axe 扫描`);
    }
  }
  const visualSpecCode = read(join(repoRoot, 'tests', 'e2e', 'specs', 'visual.spec.ts'));
  if (!visualSpecCode.includes("toHaveAttribute('data-demo-name'")) {
    fail(
      'visual.spec.ts 未断言 data-demo-name：Demo 名写错时宿主会回落到首 Demo，截错页面也算通过',
    );
  }
}

// ---------------------------------------------------------------------------
// 12. T3-14 M3 Exit：Table 体积预算实跑 + 里程碑散文记录（docs/08 §30.48）
// ---------------------------------------------------------------------------
// docs/02 §4.6 的「Table + Virtual ≤ 35 KB」含 docs/05 Phase 5 才交付的虚拟滚动；
// 判据 2 的既有口径是「未实现的预算行只报告、不伪造配置」，所以本阶段不把该行
// 塞进 .size-limit.json，而是在这里按 @size-limit/file 同口径实算 Table 基础链路：
// 逐文件 gzipSync({ level: 9 }) 求和（已用 Button 1.85 kB 与 pnpm size 输出对拍）。
const TABLE_CHAIN_BUDGET_KB = 35;
const TABLE_CHAIN_DIRS = new Set(['table', 'pagination', 'empty', 'spin']);
const tableChainGlobs = [
  ...[...TABLE_CHAIN_DIRS].map((dir) => `packages/core/dist/esm/components/${dir}/*.js`),
  'packages/core/dist/styles/components/table.css',
];
const tableChainFiles = tableChainGlobs.flatMap((pattern) => globSync(pattern, { cwd: repoRoot }));
if (tableChainFiles.length < 10) {
  fail('T3-14 的 Table 链路体积实算产物过少：path 可能空匹配（先跑 pnpm build）');
}
const tableChainBytes = tableChainFiles.reduce(
  (sum, rel) => sum + gzipSync(readFileSync(join(repoRoot, rel)), { level: 9 }).length,
  0,
);
const tableChainKb = (tableChainBytes / 1000).toFixed(2);
if (tableChainBytes / 1000 > TABLE_CHAIN_BUDGET_KB) {
  fail(
    `T3-14 Table 链路实跑 ${tableChainKb} kB 超出 docs/02 §4.6 的 ${TABLE_CHAIN_BUDGET_KB} KB 预算`,
  );
}
// 防漏算：Table 产物的相对 import 与 table.scss 的 @use 都必须落在清单目录内，
// 否则新增依赖后体积被悄悄少算，35 KB 判据会变成假绿。
const tableImplFiles = globSync('packages/core/dist/esm/components/table/*.js', {
  cwd: repoRoot,
});
const tableChainRefs =
  tableImplFiles.map((rel) => read(join(repoRoot, rel))).join('\n') +
  read(join(repoRoot, 'packages', 'core', 'src', 'components', 'table', 'table.scss'));
for (const match of tableChainRefs.matchAll(/(?:from|@use)\s+["']\.\.\/([a-z-]+)\//g)) {
  if (!TABLE_CHAIN_DIRS.has(match[1])) {
    fail(`T3-14 的 Table 链路引用了未计入体积清单的 ${match[1]} 组件目录`);
  }
}

// 未实现预算不得伪造配置，且必须在落地记录里显式声明
const t314SizeConfig = read(sizeConfigPath);
if (t314SizeConfig.includes('Table + Virtual') || t314SizeConfig.includes('单个图标')) {
  fail(
    'T3-14 不得把尚未实现的 Table + Virtual / 单个图标 预算塞进 .size-limit.json（判据 2：只报告、不伪造配置）',
  );
}
// 只认真实 .js 产物：空目录不是产物，负向实证创建 / 删除 probe 后不应残留误报。
const virtualArtifacts = globSync('packages/core/dist/esm/components/virtual/**', {
  cwd: repoRoot,
}).filter((rel) => rel.endsWith('.js'));
if (virtualArtifacts.length > 0) {
  fail('T3-14 检测到 virtual 产物：Virtual 属 Phase 5，接入后必须重校 35 KB 预算');
}
const t314Todo = read(join(repoRoot, 'docs', '08-实施Todo.md'));
const t314Section = t314Todo.split('### 30.48 ')[1]?.split('\n### 30.49')[0] ?? '';
if (t314Section.length === 0) fail('缺少 docs/08 §30.48 T3-14 落地记录');
if (!t314Section.includes('Phase 5') || !t314Section.includes('图标包')) {
  fail('docs/08 §30.48 未显式声明 Virtual（Phase 5）与图标包占位这两项待实现预算');
}

// 文档里的实算值与判据 11 扩面数字必须由机器背书，不能手写
const t314Anchor = t314Section.match(
  /机器锚点：T3-14 实算 Table 链路 \*\*([\d.]+) kB\*\* \/ 35 KB；判据 11 扩面后 \*\*(\d+) 组件 \/ (\d+) Demo \/ (\d+) 基线\*\*/,
);
if (!t314Anchor) {
  fail('docs/08 §30.48 缺少 T3-14 机器锚点行（实算值 + Demo / 基线覆盖）');
} else {
  if (t314Anchor[1] !== tableChainKb) {
    fail(
      `docs/08 §30.48 记录的 Table 实算 ${t314Anchor[1]} kB 与本次实跑 ${tableChainKb} kB 不一致`,
    );
  }
  if (Number(t314Anchor[2]) !== demoCoverage.components) {
    fail(
      `docs/08 §30.48 记录的组件数 ${t314Anchor[2]} 与 catalog 实算 ${demoCoverage.components} 不一致`,
    );
  }
  if (Number(t314Anchor[3]) !== demoCoverage.demos) {
    fail(
      `docs/08 §30.48 记录的 Demo 数 ${t314Anchor[3]} 与 catalog 实算 ${demoCoverage.demos} 不一致`,
    );
  }
  if (Number(t314Anchor[4]) !== demoCoverage.baselines) {
    fail(`docs/08 §30.48 记录的基线数 ${t314Anchor[4]} 与实有 ${demoCoverage.baselines} 不一致`);
  }
}

// M3 里程碑只做散文记录、勾选只发生在 §4.2
if (!/^\| M3 \|[^\n]*\|\s*\[ \]\s*\|$/m.test(t314Todo)) {
  fail('T3-14 的 §4 里程碑简表 M3 行被改动：里程碑只做散文记录，勾选只发生在 §4.2');
}
const t314Row = t314Todo.split('\n').find((line) => line.startsWith('| T3-14 |')) ?? '';
if (!/\[x\]\s*\|\s*$/.test(t314Row)) {
  fail('T3-14 的 §4.2 主行尚未勾 [x]');
}
const t314Governance = JSON.parse(read(join(repoRoot, 'scripts', 'todo-governance.json')));
if (t314Governance.evidence?.['T3-14'] !== '30.48') {
  fail('T3-14 勾了 [x] 但 todo-governance.json 没有 evidence 30.48');
}
if (!/当前任务 ID \|[^\n]*M4/.test(t314Todo)) {
  fail('T3-14 闭合后锚点未推进到 M4');
}

if (errors.length > 0) {
  console.error(`[check:ci] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
const pending = [...budgets.keys()].filter((name) => !covered.has(name));
console.log(
  `[check:ci] verify ${requiredStages.length} 个阶段齐全且 build 优先 · 体积预算 ${checks.length}/${budgets.size} 条与 02 §4.6 一致（未实现：${pending.join(' / ') || '无'}）· path 全部命中 dist · ci.yml 契约齐全且无发布凭据 · 用量红线（push 时运行 ${ciUsage.pushJobs}/${ciUsage.totalJobs} 个 job、跨架构矩阵按需派发、cancel-in-progress 在位、每 job 有 timeout）· 门禁分流（dev 增量 verify:main / main·tag·手动·夜间全量 verify，两门互补、作用域判定默认全量）· 全 ${workflowFiles.length} 个 workflow 扫描 · release.yml stage-only 通道在位 · 视觉基线 bundled chromium 契约在位（阈值 0.002 未放宽）· 固定字体契约在位（SHA256 锁定 / ${renderedChars.size} 字集 / 无系统回退 / OFL-1.1）· Phase 0 Spike 契约在位（${spikeCases.length} 个 Spike / ${spikeCases.reduce((sum, item) => sum + item.tests.length, 0)} 组客户端实证 / SSR 冒烟真实跑绿 / 7 份评审材料 / 不进 npm 包）· 产物零源码注释（${distArtifacts.length} 个文件）· Demo 覆盖（${demoCoverage.components} 组件 / ${demoCoverage.demos} Demo / 每组件 ≥${MIN_DEMOS}）· 视觉基线全覆盖（${demoCoverage.baselines} 张 = 组件×Demo×${SCREENSHOT_WIDTHS.length} 视口，用例按 DEMO_CASES 循环）· Table 引擎契约（单一状态真源 / 表头正文同字号 / SSR 入口在册）· Table 排序筛选契约（onChange 三参 / 状态收在引擎 / server 只出参数 / 列引用稳定 / SSR 入口在册）· Table 行选择契约（aria-checked mixed 三态 / 禁用行不进全选 / 选择控件不复用 Checkbox·Radio / SSR 入口在册）· Pagination 契约（页码收敛在引擎 / 当前页 aria-current + data-scui-current 双通道 / option selected 而非 select value / 窄屏换行 / SSR 入口在册）· 空 / 加载三件套契约（Empty 的 image=null 语义 / 骨架行块高引用正文行高 token 且间隙靠 flex 居中画出 / 形状分派必须是响应式表达式 / Spin 定时器清理与同步初值 / 转圈恒带可读文案 / 三个 SSR 入口在册）· Table 分页接入契约（组合 Pagination·Empty·Spin 且样式随 Table 样式表聚合 / footer 在滚动容器外 / 分页状态归引擎且 server 不切数据 / onChange 三参不再恒 undefined / 筛选页码归一 / 空与加载态互斥 / SSR 入口在册）· Modal 契约（复用共享浮层原语 / 焦点归还自己接管 / 异步 pending 拦截全部关闭入口 / 受控优先级 / footer 样式随 modal.css 聚合 / SSR 入口在册）· Drawer 契约（组件层零浮层实现且全部走共享原语 / 四方向在类型·运行时·贴边样式三层齐全 / width·height 按方向归一 / 受控优先级 / 逻辑属性贴边与窄屏收窄 / footer 样式随 drawer.css 聚合 / SSR 入口在册）· T3-09 反馈与锚定浮层契约（组件层零浮层实现且全部走 primitives/anchored / 锚定原语不重复实现焦点归还 / 十二向 data-scui-anchor 三层齐全 / 延迟两层透传 / Popconfirm 异步 pending 与 Modal 同形 / Alert 四种 kind 与可关闭·操作区 / 三个 SSR 入口在册且真实调用静态 message·useApp）· Card / Tag 展示契约（Card 四块按内容缺席且加载复用 Skeleton / Tag 五档 data-scui-color 三层齐全 / bordered 存在即真且边框恒 1px / 可关闭非受控且恒带 aria-label / 属性与 role 登记补齐 / 两个 SSR 入口在册）· Tabs / Descriptions 契约（组件层零键盘·焦点·ARIA 实现且全走 Kobalte Tabs 原语 / 受控优先级 / 线型·卡片三层 / content 惰性工厂让懒加载真的推迟节点创建 / 激活态复用 data-scui-current / Descriptions 用 dl·dt·dd 且 column·span·bordered 三层齐全 / 新增 column 与补登记 span / 两个 SSR 入口在册）· CRUD 列表页组合契约（挂 table/demos 复用页面级 Demo 先例 / Form 查询·Modal 新增编辑·Popconfirm 删除·全局 message 四链接线 / onChange 三参真被消费 / SSR 独立静态骨架且弹层 counts 锁 0 / 四条手写 E2E 与 axe 组合用例在册 / 页面级 Demo 不新造 data-scui-*）· Upload 上传契约（customRequest 单点注入传输且组件内零 fetch·XHR / 进度·成功·失败·取消·删除·重试六链 / 受控值桥 Form 字段 > fileList > 内部副本 / 新增 status·dragging 两属性并登记 / Form.Item 用 ids.control 与字段 aria / SSR 静态三态骨架且 counts 钉死 / 3 Demo + 5 手写 E2E + axe / 零新增依赖）· size-limit@${sizeLimit} + file 插件 · M3 Exit 检查（Table 链路实跑 ${tableChainKb} kB / 35 KB，Virtual 与单图标 pending；${demoCoverage.components} 组件 / ${demoCoverage.demos} Demo / ${demoCoverage.baselines} 基线；里程碑散文记录）`,
);
