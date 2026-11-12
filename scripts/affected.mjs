#!/usr/bin/env node
/**
 * 增量 e2e 作用域判定（docs/08 §30.33）。
 *
 * 背景：verify 的 26 阶段里只有 e2e 吃时间（CI 实测 350s / 433s，占 81%），
 * 其中 browser 159s + visual 142s 全部按「组件 × Demo」逐页跑。main 分支日常
 * 提交通常只动一两个组件，没有理由每次都重跑 106 张截图。
 *
 * 判定原则：**默认全量，白名单才收缩**。
 * 任何未识别路径、任何共享面路径、任何读不出基线的情况，一律返回 `all`——
 * 宁可多跑 8 分钟，也不能把回归静默跳过。
 *
 * 输出（stdout 一行机读 + 一行人读）：
 *   scope=all | none | slug,slug
 * `--github-env` 时额外把 SCUI_E2E_SCOPE 写进 $GITHUB_ENV，供后续 step 使用。
 *
 * 用法：
 *   node scripts/affected.mjs                          # 本地：比对 HEAD~1..HEAD
 *   node scripts/affected.mjs --base <sha>             # CI：比对 push 前的 sha
 *   node scripts/affected.mjs --base <sha> --github-env
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');

/** 共享面：命中任意一条 → 全量。顺序无关，全部为「宁可全跑」的保守规则。 */
const SHARED_PATTERNS = [
  // 组件之外的 core 源码：样式 / 原语 / 工具 / 钩子 / 本地化 / 配置，任何一个都影响全部 Demo
  /^packages\/core\/src\/(styles|primitives|utils|hooks|locale|config-provider|__tests__)\//,
  /^packages\/core\/src\/(index|scope)\.ts$/,
  // selection 是 checkbox / radio / switch / select 共用逻辑，demos 是 Demo 公共壳：
  // 两者都不属于任何单个组件，改动面天然是全局
  /^packages\/core\/src\/components\/(selection|demos)\//,
  // 图标与设计 token 全仓共用
  /^packages\/(icons|tokens)\//,
  // Demo 宿主：standalone 决定所有截图页的骨架，lib / styles 决定脚手架样式
  /^apps\/docs\/src\/(standalone|App|main)\.tsx$/,
  /^apps\/docs\/src\/(lib|styles)\//,
  // 测试与门禁自身：改用例 / 改配置 / 改构建脚本都必须全量复验
  /^tests\//,
  /^scripts\//,
  /^playwright\.config\.ts$/,
  /^\.github\//,
  // 依赖与工具链：lock / workspace / turbo / tsconfig / biome / size-limit
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|biome\.json|\.node-version)$/,
  /^tsconfig[^/]*\.json$/,
  /(^|\/)package\.json$/,
  /^\.size-limit\.json$/,
];

/** 文档面：只改这些 → 浏览器 / 截图链可跳过（docs / llms 两条会跑）。 */
const DOC_PATTERNS = [
  /^docs\//,
  /\.mdx?$/i,
  /^README/i,
  /^\.changeset\//,
  /^apps\/docs\/src\/(pages|content|generated)\//,
];

/** 组件目录：`packages/core/src/components/<slug>/`。 */
const COMPONENT_PATTERN = /^packages\/core\/src\/components\/([a-z0-9-]+)\//;

function parseArgs(argv) {
  const args = { base: undefined, head: 'HEAD', githubEnv: false, quiet: false, files: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--base') {
      args.base = argv[index + 1] ?? '';
      index += 1;
    } else if (token === '--head') {
      args.head = argv[index + 1] ?? 'HEAD';
      index += 1;
    } else if (token === '--files') {
      // 调试 / 自检用：直接给一份改动清单，跳过 git（不参与 CI 流程）
      args.files = (argv[index + 1] ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
    } else if (token === '--github-env') {
      args.githubEnv = true;
    } else if (token === '--quiet') {
      args.quiet = true;
    } else if (token.startsWith('--')) {
      throw new Error(`[affected] 未知参数 ${token}`);
    }
  }
  return args;
}

function git(args, options = {}) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', ...options }).trim();
}

function tryGit(args) {
  try {
    // cat-file -e 成功时正常没有输出，不能用返回值真假判断「对象是否存在」，
    // 只返回 null / 字符串两种结果；stderr 一律吞掉（探针不该污染日志）
    return git(args, { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

/** catalog 是「哪些 slug 算组件」的唯一来源，避免手写组件名单与实现漂移。 */
function loadKnownSlugs() {
  const raw = JSON.parse(
    readFileSync(resolve(repoRoot, 'apps/docs/src/generated/catalog.json'), 'utf8'),
  );
  return new Set(raw.components.map((component) => component.slug));
}

function changedFiles(base, head) {
  return git(['diff', '--name-only', '--no-renames', `${base}..${head}`])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function decide(files, knownSlugs) {
  // 1. 共享面优先：只要有一条命中，立即全量，不再看组件
  for (const file of files) {
    if (SHARED_PATTERNS.some((pattern) => pattern.test(file))) {
      return { scope: 'all', reason: `命中共享面 ${file}` };
    }
  }

  // 2. 组件目录：全部落在同一批已知 slug 上才收缩
  const slugs = new Set();
  const docOnly = [];
  for (const file of files) {
    const component = COMPONENT_PATTERN.exec(file);
    if (component) {
      const slug = component[1];
      if (!knownSlugs.has(slug)) {
        // selection / demos 之外未来若出现新的非组件目录，这里会兜住
        return { scope: 'all', reason: `${file} 不在 catalog 组件清单内` };
      }
      slugs.add(slug);
      continue;
    }
    if (DOC_PATTERNS.some((pattern) => pattern.test(file))) {
      docOnly.push(file);
      continue;
    }
    // 3. 兜底：任何未识别路径 → 全量（fail-safe）
    return { scope: 'all', reason: `未识别路径 ${file}` };
  }

  if (slugs.size > 0) {
    return {
      // toSorted + localeCompare：oxlint 的 require-array-sort-compare 与
      // no-array-sort 都要满足，且输出顺序必须稳定（同一份 diff 每次结果一致）
      scope: Array.from(slugs)
        .toSorted((a, b) => a.localeCompare(b))
        .join(','),
      reason: `${slugs.size} 个组件目录变更${docOnly.length > 0 ? ` + ${docOnly.length} 个文档文件` : ''}`,
    };
  }
  if (docOnly.length > 0) {
    return { scope: 'none', reason: `${docOnly.length} 个文档文件，浏览器 / 截图链可跳过` };
  }
  return { scope: 'none', reason: '空 diff' };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const knownSlugs = loadKnownSlugs();

  if (args.files) {
    const decision = decide(args.files, knownSlugs);
    return report(decision, args, args.files.length);
  }

  let base;
  if (args.base === undefined) {
    // 本地默认比对上一个提交；没有父提交（首个提交）则全量
    base = tryGit(['rev-parse', `${args.head}~1`]);
    if (!base) {
      return report({ scope: 'all', reason: 'HEAD 无父提交，无法比对' }, args, 0);
    }
  } else if (!args.base || /^0+$/.test(args.base)) {
    // push 创建分支 / 强推时 github.event.before 全是 0
    return report({ scope: 'all', reason: '无基线 sha（新分支 / 强推）' }, args, 0);
  } else {
    base = args.base;
  }

  // CI 默认浅克隆（fetch-depth 1），基线提交可能根本不在本地对象库里
  if (tryGit(['cat-file', '-e', `${base}^{commit}`]) === null) {
    return report({ scope: 'all', reason: `基线 ${base} 不在本地仓库（浅克隆）` }, args, 0);
  }

  const files = changedFiles(base, args.head);
  const decision = decide(files, knownSlugs);
  return report(decision, args, files.length);
}

function report(decision, args, fileCount) {
  const line = `scope=${decision.scope}`;
  if (!args.quiet) {
    console.log(line);
    console.log(`[affected] ${fileCount} 个文件 → ${decision.scope}（${decision.reason}）`);
  } else {
    console.log(line);
  }
  if (args.githubEnv) {
    const envPath = process.env.GITHUB_ENV;
    if (!envPath) throw new Error('[affected] --github-env 需要 GITHUB_ENV 环境变量');
    appendFileSync(envPath, `SCUI_E2E_SCOPE=${decision.scope}\n`);
  }
  return 0;
}

process.exitCode = main();
