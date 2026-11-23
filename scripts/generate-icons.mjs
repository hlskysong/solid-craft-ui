/**
 * 图标生成器：从 lucide-solid 全量图标，生成自包含的 Solid TSX 模块。
 *
 * 决策依据：
 * - docs/01 §技术选型：图标源选 lucide-solid（锁定版本）。
 * - docs/02 §4.5 图标构建：每图标独立模块、currentColor / size="1em" / stroke-width 可覆盖。
 * - docs/03 §10：线性图标、stroke-width 1.75、currentColor、圆角端点；
 *   库对子 svg 强制 1em（core 的 icon.scss 已做），写死尺寸也能跟随 size 档。
 * - T4-18（Aming 2026-11-23 裁决）：从精选 53 扩为全量。lucide v1.69.0 的 source/icons
 *   有 2317 个文件，其中 293 个是无 __iconData 的 alias 转发（esm/types 里无对应产物），
 *   跟随到实体后共 2024 个独立形状 = lucide 官方导出口径。本脚本按实体生成 2024 个组件，
 *   alias 名作为搜索关键词挂到目标组件；文档站图标页据此覆盖全部 2317 个名字。
 *
 * 做法：直接读 lucide 的 dist/source/icons/<name>.jsx，提取 __iconData 的 name / node / aliases，
 * 生成不含 lucide 运行时的独立组件（运行时零依赖 lucide）。graph 节点是纯 [tag, attrs] 数组，
 * 静态 JSX 展开（Solid template() 编译），无运行时循环。
 *
 * 用法：node scripts/generate-icons.mjs
 * 幂等：重复运行产出字节一致；只覆盖 generated/ 与 index.ts 的自动生成段。
 *
 * 分类：按图标名关键词归入 TDesign/Ant Design 风格的分组（见 CATEGORY_RULES），
 * 每组有唯一 id / 中文标签；分类只服务于文档站浏览，不影响组件 API。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { format as prettierFormat, resolveConfig as prettierConfig } from 'prettier';

const require = createRequire(import.meta.url);
const repoRoot = resolve(import.meta.dirname, '..');
const outDir = join(repoRoot, 'packages/icons/src/generated');
const indexPath = join(repoRoot, 'packages/icons/src/index.ts');

/**
 * 文档站分类规则：按图标名关键词匹配，顺序即优先级（先匹配到者胜）。
 * 标签文案与 apps/docs 字集逐字一致，新增汉字需重跑字体与视觉基线。
 */
const CATEGORIES = [
  { id: 'all', label: '全部' },
  {
    id: 'arrows',
    label: '箭头',
    match:
      /^(arrow|chevron|corner|move|navigation|trending|redo|undo|rotate|reply|forward|signpost|milestone|step|corner)/,
  },
  {
    id: 'navigation',
    label: '导航',
    match:
      /^(house|home|menu|panel|layout|sidebar|compass|map|route|sign|flag|bookmark|external|log-|door|exit|locate|crosshair|navigation)/,
  },
  {
    id: 'ui',
    label: '界面',
    match:
      /^(search|filter|settings|sliders|adjustments|menu|list|grid|rows|columns|layout|panel|sidebar|maximize|minimize|expand|shrink|fullscreen|eye|zoom|scan|focus|click|pointer|cursor|hand|drag|grip|move|resize)/,
  },
  {
    id: 'communication',
    label: '消息',
    match:
      /^(mail|message|chat|send|inbox|phone|call|bell|notification|megaphone|radio|rss|at-sign|contact|address)/,
  },
  {
    id: 'media',
    label: '影音',
    match:
      /^(play|pause|stop|skip|rewind|fast|music|audio|video|volume|speaker|mic|headphones|camera|image|picture|gallery|film|clapperboard|disc|vinyl|podcast|tv|monitor|projector)/,
  },
  {
    id: 'files',
    label: '文件',
    match:
      /^(file|folder|document|paperclip|book|notebook|note|clipboard|archive|trash|download|upload|save|print|sticky|scroll|page|contract|receipt|invoice|spreadsheet|presentation|image-down|hard-drive|database)/,
  },
  {
    id: 'text',
    label: '文本',
    match:
      /^(type|text|bold|italic|underline|strikethrough|align|indent|outdent|list|quote|code|braces|heading|pilcrow|case-|letter|spell|languages|translate|paragraph|wrap|word|font)/,
  },
  {
    id: 'data',
    label: '数据',
    match:
      /^(chart|bar-|pie-|line-|area-|graph|activity|trend|database|table|columns-3|calculate|calculator|sigma|percent|hash|number|sort|filter|gauge|sliders|axis|candlestick|spline|funnel|donut|hexagon|radar)/,
  },
  {
    id: 'time',
    label: '时间',
    match:
      /^(calendar|clock|timer|stopwatch|hourglass|alarm|watch|history|rotate-ccw|rewind|fast-forward|sun|moon|sunrise|sunset|day|night)/,
  },
  {
    id: 'security',
    label: '安全',
    match:
      /^(lock|unlock|key|shield|eye-off|fingerprint|scan-face|scan-fingerprint|password|user-check|user-x|verified|badge-check|circle-check|circle-x|check|alert|info|help|warning|octagon-alert|triangle-alert|ban|block)/,
  },
  {
    id: 'users',
    label: '人物',
    match:
      /^(user|users|person|people|baby|accessibility|wheelchair|accessibility|hand|heart|smile|frown|meh|face|portrait|user-round|user-square|user-circle)/,
  },
  {
    id: 'commerce',
    label: '购物',
    match:
      /^(shopping|cart|bag|wallet|credit-card|banknote|money|dollar|euro|pound|yen|coins|badge|gift|package|box|truck|shipping|store|tag|ticket|barcode|qr|percent|gavel|briefcase|building|factory|landmark)/,
  },
  {
    id: 'nature',
    label: '生活',
    match:
      /^(sun|moon|cloud|rain|snow|wind|storm|droplet|waves|flame|fire|leaf|tree|flower|sprout|seed|mountain|volcano|globe|earth|snowflake|thermometer|umbrella|zap|lightning|star|sparkles)/,
  },
  {
    id: 'devices',
    label: '设备',
    match:
      /^(laptop|desktop|monitor|tablet|smartphone|phone|watch|tv|printer|scanner|keyboard|mouse|hard-drive|server|cpu|memory|database|wifi|bluetooth|usb|battery|power|plug|router|cable|webcam|speaker|headphone|mic|radio|satellite)/,
  },
  {
    id: 'editing',
    label: '编辑',
    match:
      /^(pencil|pen|edit|brush|paint|eraser|highlighter|marker|scissors|copy|clipboard|paste|cut|link|unlink|paperclip|pin|pushpin|crosshair|wrench|hammer|tool|screwdriver|settings-2|sliders-horizontal|rotate|flip|crop|transform|palette|droplet|pipette)/,
  },
];

/** 图标名 → 分类 id：按 CATEGORIES 顺序首个命中。 */
function categorize(name) {
  for (const cat of CATEGORIES) {
    if (cat.match?.test(name)) return cat.id;
  }
  return 'other';
}

/** kebab-case 文件名 → PascalCase 组件名（如 layout-dashboard → LayoutDashboard）。 */
function toExportName(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * 大小写不敏感文件系统（macOS 默认）的撞名消歧：文件名覆盖表。
 * letters → Letters 与 letter-s → LetterS 在 macOS 上是同一文件名，
 * 故给前者单独指定内部文件名；对外导出名保持官方 PascalCase 不变。
 */
const FILE_NAME_OVERRIDE = { letters: 'LettersAll' };

/**
 * 兼容别名：精选期手工映射但 lucide 1.69.0 已不存在的名字，保留导出避免既有代码破坏。
 * 键 = 期望导出名，值 = 实体名（必须存在于 entities）。
 */
const COMPAT_ALIASES = { Refresh: 'refresh-cw' };

/** require.resolve 拿 cjs 入口，回溯到包根（pnpm 软链的真实包目录）。 */
function lucidePackageDir() {
  const entry = require.resolve('lucide-solid');
  let dir = dirname(entry);
  while (dir !== dirname(dir) && !existsSync(join(dir, 'package.json'))) {
    dir = dirname(dir);
  }
  if (!existsSync(join(dir, 'dist', 'source', 'icons'))) {
    throw new Error(`lucide-solid 包结构异常：${dir}`);
  }
  return dir;
}

/** lucide 数据的键是裸标识符，补引号后即为合法 JSON（不用 Function/eval，过 no-implied-eval）。 */
function quoteKeys(js) {
  return js.replace(/([{,]\s*)([a-zA-Z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
}

/** 从 lucide 图标 jsx 源里抠出 __iconData 对象（name / size / node / aliases）。 */
function extractIconData(iconsDir, file, seen = new Set()) {
  if (seen.has(file)) throw new Error(`lucide 图标转发成环：${file}`);
  seen.add(file);
  const src = readFileSync(join(iconsDir, file), 'utf8');
  const start = src.indexOf('var __iconData = {');
  if (start < 0) {
    // alias 转发文件：import { default as default2 } from "./target"; 继续跟到真实图标
    const m = src.match(/import\s+\{\s*default as \w+\s*\}\s+from\s+"\.\/([\w-]+)"/);
    if (m) return extractIconData(iconsDir, `${m[1]}.jsx`, seen);
    throw new Error(`${file} 未找到 __iconData 也非 alias 转发`);
  }
  const end = src.indexOf('\n};', start);
  if (end < 0) throw new Error(`${file} 的 __iconData 未闭合`);
  const body = src.slice(start + 'var __iconData = '.length, end + 2);

  // 不用 Function/eval（oxlint no-implied-eval）：lucide 的数据是 JS 对象字面量，
  // 键为裸标识符、值为字符串/数字/数组。给裸键补引号后即为合法 JSON，再 JSON.parse。
  const name = body.match(/name:\s*"([^"]+)"/)?.[1];
  const size = Number(body.match(/size:\s*(\d+)/)?.[1] ?? 24);
  const aliases = [...body.matchAll(/aliases:\s*\[([^\]]*)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/"([^"]+)"/g)].map((a) => a[1]),
  );
  const nodeAt = body.indexOf('node: [');
  if (!name || nodeAt < 0) throw new Error(`${file} 的 __iconData 字段解析失败`);
  // node 是嵌套数组，用括号平衡找到精确结束（不能靠非贪婪正则，后面可能有/没有 aliases）
  const open = body.indexOf('[', nodeAt);
  let depth = 0;
  let close = -1;
  for (let i = open; i < body.length; i++) {
    if (body[i] === '[') depth++;
    else if (body[i] === ']' && --depth === 0) {
      close = i;
      break;
    }
  }
  if (close < 0) throw new Error(`${file} 的 node 数组未闭合`);
  let node;
  try {
    node = JSON.parse(quoteKeys(body.slice(open, close + 1)));
  } catch (err) {
    throw new Error(`${file} 的 node 不是可解析 JSON：${String(err)}`, { cause: err });
  }
  return { name, size, node, aliases };
}

/** 把 lucide 节点渲染成静态 JSX（构建期展开，零运行时循环 / 零 key 透传）。 */
function renderNodes(node) {
  return node
    .map(([tag, attrs]) => {
      // lucide 的 key 是给 React diff 用的，透传到 Solid 的 SVG 元素会变成无效 DOM 属性
      const clean = Object.entries(attrs).filter(([k]) => k !== 'key');
      const props = clean.map(([k, v]) => `${k}="${v}"`).join(' ');
      return `      <${tag} ${props} />`;
    })
    .join('\n');
}

async function renderComponent(exportName, data) {
  const size = data.size ?? 24;
  const aliasNote =
    Array.isArray(data.aliases) && data.aliases.length
      ? ` lucide 别名：${data.aliases.join(' / ')}。`
      : '';
  const raw = `import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ${exportName}Props extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** 尺寸，默认 1em（跟随父级 font-size；core 的 .scui-icon svg 强制 1em）。 */
  size?: string | number;
  /** 线条宽度，默认 1.75（docs/03 §10）。 */
  strokeWidth?: string | number;
}

/** 由 lucide-solid v${LUCIDE_VERSION} 全量生成（name: ${data.name}）。${aliasNote} */
export function ${exportName}(props: ${exportName}Props) {
  const [local, rest] = splitProps(props, ['size', 'strokeWidth']);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={local.size ?? '1em'}
      height={local.size ?? '1em'}
      viewBox="0 0 ${size} ${size}"
      fill="none"
      stroke="currentColor"
      stroke-width={local.strokeWidth ?? 1.75}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      {...rest}
    >
${renderNodes(data.node)}
    </svg>
  );
}

export default ${exportName};
`;
  // 产出即符合仓库 prettier 规范（读 .prettierrc.json：单引号 / printWidth 100），
  // 避免 lint:format 反复红灯；长名签名由 prettier 自动换行。
  const options = await prettierConfig(join(repoRoot, '.prettierrc.json'));
  return prettierFormat(raw, {
    filepath: join(outDir, `${exportName}.tsx`),
    ...options,
  });
}

const LUCIDE_DIR = lucidePackageDir();
const LUCIDE_VERSION = JSON.parse(readFileSync(join(LUCIDE_DIR, 'package.json'), 'utf8')).version;
const iconsDir = join(LUCIDE_DIR, 'dist', 'source', 'icons');
const files = readdirSync(iconsDir).filter((f) => f.endsWith('.jsx'));
const esmIconsDir = join(LUCIDE_DIR, 'dist', 'esm', 'icons');
const esmFiles = new Set(readdirSync(esmIconsDir).filter((f) => f.endsWith('.mjs')));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

/**
 * 全量扫描：每个源文件跟随 alias 拿到实体 data.name；按 data.name 去重。
 * esm/icons 里没有产物的名字是纯 alias 转发，只登记为搜索关键词，不生成组件。
 */
const byEntity = new Map(); // entity name -> { data, aliases: string[] }
for (const file of files) {
  const sourceName = file.replace(/\.jsx$/, '');
  const data = extractIconData(iconsDir, file);
  const entity = data.name;
  if (!byEntity.has(entity))
    byEntity.set(entity, { data, aliases: [], exportName: toExportName(entity) });
  const record = byEntity.get(entity);
  if (!record.aliases.includes(sourceName)) record.aliases.push(sourceName);
  for (const alias of data.aliases ?? []) {
    if (!record.aliases.includes(alias)) record.aliases.push(alias);
  }
}

// 只生成 lucide 官方有产物的实体（esm/icons/<name>.mjs 存在），跳过纯 alias 转发名。
const entities = [...byEntity.entries()]
  .filter(([name]) => esmFiles.has(`${name}.mjs`))
  .sort(([a], [b]) => a.localeCompare(b));

// 撞名守卫：导出名或大小写不敏感文件名重复时立即失败，避免静默覆盖（macOS 默认文件系统）。
const exportNames = new Set();
const fileNames = new Set();
for (const [name, record] of entities) {
  if (exportNames.has(record.exportName)) {
    throw new Error(`组件名撞车：${name} → ${record.exportName}`);
  }
  const fileName = FILE_NAME_OVERRIDE[name] ?? record.exportName;
  if (fileNames.has(fileName.toLowerCase())) {
    throw new Error(`文件名撞车（大小写不敏感）：${name} → ${fileName}`);
  }
  exportNames.add(record.exportName);
  fileNames.add(fileName.toLowerCase());
}

const entries = [];
for (const [name, record] of entities) {
  const { exportName, data } = record;
  const fileName = FILE_NAME_OVERRIDE[name] ?? exportName;
  writeFileSync(join(outDir, `${fileName}.tsx`), await renderComponent(exportName, data));
  entries.push({
    name,
    exportName,
    fileName,
    aliases: record.aliases,
    category: categorize(name),
    node: data.node,
  });
}

/**
 * alias 导出：lucide 的 293 个纯转发名 + 精选期兼容名，全部 re-export 到对应实体。
 * 这样 2317 个名字都能 `import { X } from 'solid-craft-icons'`，真正"全量进包"。
 */
const entityByName = new Map(entities);
const aliasExports = new Map(); // alias 导出名 -> 实体导出名
for (const [name, record] of entityByName) {
  for (const alias of record.aliases) {
    if (alias === name) continue;
    const aliasName = toExportName(alias);
    if (exportNames.has(aliasName)) continue; // 已是实体导出名，无需重复
    if (!aliasExports.has(aliasName)) aliasExports.set(aliasName, record.exportName);
  }
}
for (const [aliasName, entityName] of Object.entries(COMPAT_ALIASES)) {
  if (!entityByName.has(entityName))
    throw new Error(`兼容别名的实体不存在：${aliasName} → ${entityName}`);
  if (exportNames.has(aliasName)) continue;
  if (!aliasExports.has(aliasName))
    aliasExports.set(aliasName, entityByName.get(entityName).exportName);
}

const entityExportLines = entries
  .map(({ exportName, fileName }) => `export { ${exportName} } from './generated/${fileName}';`)
  .join('\n');
const aliasExportLines = [...aliasExports.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(
    ([aliasName, entityName]) =>
      `export { ${entityName} as ${aliasName} } from './generated/${entityName}';`,
  )
  .join('\n');
const index = `/**
 * solid-craft-icons：由 lucide-solid v${LUCIDE_VERSION} 全量生成（scripts/generate-icons.mjs）。
 * 根导出 ${entries.length} 个实体图标 + ${aliasExports.size} 个 alias 导出，覆盖 lucide 全部 ${files.length} 个名字；
 * 每图标独立模块，运行时零依赖 lucide。图标清单见 generated/catalog.json。
 */
export const ICONS_PACKAGE_VERSION = '0.1.0';
export const ICON_TOTAL = ${entries.length};
export const ICON_NAME_TOTAL = ${files.length};

${entityExportLines}
${aliasExportLines}
`;
writeFileSync(indexPath, index);

// 图标清单：文档站图标页的数据真源（名字 / 组件 / 别名 / 分类），写进包内 generated/。
const catalog = {
  version: LUCIDE_VERSION,
  total: entries.length,
  nameTotal: files.length,
  categories: CATEGORIES.map(({ id, label }) => ({ id, label })),
  icons: entries,
};
writeFileSync(join(outDir, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);

console.log(
  `[generate-icons] lucide v${LUCIDE_VERSION}：${files.length} 个名字 → ${entries.length} 个实体组件 + ${files.length - entries.length} 个 alias 关键词 → ${outDir}`,
);
