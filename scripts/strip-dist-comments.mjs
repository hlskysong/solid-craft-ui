/**
 * 剥离发布产物里的注释 —— T2-12 体积预算的真实修复（docs/08 §30.30）。
 *
 * 背景：`docs/02` 明确 `build.minify: false`「库产物不压缩，交给消费方；保留 sourcemap」。
 * 但实测发现 dist/esm 把**源码里的中文 JSDoc 全文**一起发了出去，这部分对消费方毫无价值
 * （类型文档在 `dist/types/*.d.ts` 里已经有一份），却占了 `Form + Input + Select`
 * 实测 29.44 KB gzip 中的约 12 KB。
 *
 * 所以这里只做一件事：**删注释，不动代码**。
 *   - 不压缩空白、不混淆标识符、不改语法 —— 仍然满足「不压缩」的架构决策；
 *   - 注释按「原注释里的换行数」等量替换成换行，**行号与行序完全不变**，
 *     因此 `*.js.map` 的行级映射继续有效（列级只在「行内尾随注释」那几行会偏，
 *     脚本会统计并打印这类注释数，便于复核）；
 *   - `//# sourceMappingURL=` 与 `/*!` 开头的 legal banner 一律保留。
 *
 * 只处理产物，不碰 `dist/source`（`solid` 条件消费的是源码，本来就该可读）与 `dist/types`。
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { parseSync } from 'oxc-parser';

const repoRoot = resolve(import.meta.dirname, '..');

/** 读取包名参数（缺省 packages/core），与 `build-source.mjs` 的调用形态保持一致。 */
const target = process.argv[2] ?? 'packages/core';
const pkgDir = resolve(repoRoot, target);

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
};

/** 注释文本里的换行数 —— 用它生成等量换行，行号才不漂移。 */
const newlineCount = (text) => (text.match(/\n/g) ?? []).length;

/**
 * 必须保留的注释 —— 它们不是文档，是**构建/打包指令**：
 *   - `/*#__PURE__*` + `/` 与 `/* @__PURE__ *` + `/`：消费方打包器的 tree-shaking 依据，
 *     删掉会让整棵组件树被误判成有副作用而无法摇掉（真实回归，不是体积问题）；
 *   - `//# sourceMappingURL=`：产物到 map 的唯一指针；
 *   - `/*! … *` + `/`：legal banner（许可证/署名）。
 */
const mustKeep = (comment) => {
  const value = comment.value ?? '';
  const trimmed = value.trimStart();
  if (trimmed.startsWith('#') || trimmed.startsWith('@__')) return true;
  return value.startsWith('!');
};

/**
 * JS：用 `oxc-parser` 拿精确的注释区间（比正则可靠 —— 正则会被字符串里的 `//`、`/*` 骗到）。
 * 每段注释替换成 `${新行数}` 个 `\n`，其余字节原样保留。
 */
const stripJs = (code) => {
  const { comments, errors } = parseSync('chunk.js', code);
  if (errors.length > 0) throw new Error(`解析失败：${errors[0]?.message ?? errors[0]}`);
  let out = '';
  let cursor = 0;
  let removed = 0;
  let inline = 0;
  for (const comment of comments) {
    if (mustKeep(comment)) continue;
    const [start, end] = [comment.start, comment.end];
    const raw = code.slice(start, end);
    // `start` 之前到本行行首是否已有非空字符 ⇒ 这是行内尾随注释，列级映射会偏
    const lineStart = code.lastIndexOf('\n', start) + 1;
    if (code.slice(lineStart, start).trim().length > 0) inline += 1;
    out += code.slice(cursor, start) + '\n'.repeat(newlineCount(raw));
    cursor = end;
    removed += raw.length;
  }
  out += code.slice(cursor);
  return { code: out, removed, inline };
};

/** CSS：样式表里不存在字符串形式的 `/*`，正则足够；同样按换行数等量替换。 */
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const stripCss = (css) => {
  let removed = 0;
  const code = css.replace(CSS_COMMENT, (raw) => {
    if (raw.startsWith('/*!')) return raw;
    removed += raw.length;
    return '\n'.repeat(newlineCount(raw));
  });
  return { code, removed, inline: 0 };
};

const files = [
  ...walk(join(pkgDir, 'dist', 'esm')).filter((file) => extname(file) === '.js'),
  ...walk(join(pkgDir, 'dist', 'styles')).filter((file) => extname(file) === '.css'),
];
if (files.length === 0) {
  throw new Error(`[strip-dist-comments] ${target}/dist 下没有产物，先跑 build`);
}

let totalRemoved = 0;
let touched = 0;
let emptied = 0;
const inlineHits = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const isJs = extname(file) === '.js';
  if (startCount(source) === 0) continue;
  const { code, removed, inline } = isJs ? stripJs(source) : stripCss(source);
  if (removed === 0) continue;
  // 不变式：`__PURE__` 打包指令一个都不能少（少了就是 tree-shaking 回归，比体积超标严重得多）
  const pureBefore = (source.match(/__PURE__/g) ?? []).length;
  const pureAfter = (code.match(/__PURE__/g) ?? []).length;
  if (pureAfter !== pureBefore) {
    throw new Error(
      `[strip-dist-comments] ${file}：__PURE__ 指令 ${pureBefore} → ${pureAfter}，剥离逻辑误删`,
    );
  }
  // 不变式二：行数一字不差 —— sourcemap 的 mappings 是按「行/列」记的，行号漂了就等于 map 失效。
  // 「等量换行」的替换方式如果被谁改成直接删注释，这里会立刻炸，而不是等到消费方调试时才发现。
  if (newlineCount(code) !== newlineCount(source)) {
    throw new Error(
      `[strip-dist-comments] ${file}：行数漂移 ${newlineCount(source)} → ${newlineCount(code)}（sourcemap 会失效）`,
    );
  }
  writeFileSync(file, code);
  totalRemoved += removed;
  touched += 1;
  // `types.js` 这类「只导出类型」的模块产物本身只有一行注释，剥完就是空模块（合法 ESM）
  if (code.trim().length === 0) emptied += 1;
  if (inline > 0) inlineHits.push(`${file.slice(pkgDir.length + 1)}（${inline} 处行内注释）`);
}

/** 注释总数（用换行前的粗判，避免对每个文件都跑一次 AST 解析）。 */
function startCount(text) {
  return (text.match(/\/\*|\/\/#|^\/\//gm) ?? []).length;
}

if (touched === 0) {
  console.log(`[strip-dist-comments] ${target}：产物里没有可剥离的注释（${files.length} 个文件）`);
} else {
  console.log(
    `[strip-dist-comments] ${target}：${touched}/${files.length} 个产物省下 ${(totalRemoved / 1024).toFixed(2)} KB 原始字节（gzip 收益见 pnpm size）；行号零漂移`,
  );
  if (emptied > 0) {
    console.log(
      `[strip-dist-comments] 其中 ${emptied} 个纯注释模块变为空模块（types.js 之类，合法 ESM）`,
    );
  }
  if (inlineHits.length > 0) {
    console.log(
      `[strip-dist-comments] 行内尾随注释 ${inlineHits.length} 个文件（列级 sourcemap 会偏）：`,
    );
    for (const hit of inlineHits.slice(0, 5)) console.log(`  · ${hit}`);
  }
}
