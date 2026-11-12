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
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

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
const FONT_SHA256 = 'f4aa02f31d0817e9c69fd5c0abccbcfd89234e5f4d0a7b17abae5f40af3fcf0d';
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
if (!existsSync(join(repoRoot, 'scripts', 'build-visual-font.py'))) {
  fail('缺少可复现的字体子集生成脚本 scripts/build-visual-font.py');
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

if (errors.length > 0) {
  console.error(`[check:ci] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
const pending = [...budgets.keys()].filter((name) => !covered.has(name));
console.log(
  `[check:ci] verify ${requiredStages.length} 个阶段齐全且 build 优先 · 体积预算 ${checks.length}/${budgets.size} 条与 02 §4.6 一致（未实现：${pending.join(' / ') || '无'}）· path 全部命中 dist · ci.yml 契约齐全且无发布凭据 · 用量红线（push 时运行 ${ciUsage.pushJobs}/${ciUsage.totalJobs} 个 job、跨架构矩阵按需派发、cancel-in-progress 在位、每 job 有 timeout）· 全 ${workflowFiles.length} 个 workflow 扫描 · release.yml stage-only 通道在位 · 视觉基线 bundled chromium 契约在位（阈值 0.002 未放宽）· 固定字体契约在位（SHA256 锁定 / ${renderedChars.size} 字集 / 无系统回退 / OFL-1.1）· Phase 0 Spike 契约在位（${spikeCases.length} 个 Spike / ${spikeCases.reduce((sum, item) => sum + item.tests.length, 0)} 组客户端实证 / SSR 冒烟真实跑绿 / 7 份评审材料 / 不进 npm 包）· 产物零源码注释（${distArtifacts.length} 个文件）· size-limit@${sizeLimit} + file 插件`,
);
