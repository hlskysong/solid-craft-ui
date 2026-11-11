/**
 * R3 访问器契约门禁（Aming 2026-11-11 裁决「r2 r3 a + 函数类型禁用约束」）。
 *
 * 背景：`MaybeAccessor<T> = T | Accessor<T>`（`packages/core/src/utils/resolve-value.ts`）。
 * `resolveValue` 用 `typeof value === 'function'` 判断「这是 getter 还是值」，所以一旦 `T`
 * 本身是函数类型，值与 getter 在运行时**不可区分** —— `MaybeAccessor<() => void>` 形同
 * `Accessor<() => void>` 或干脆两头都错。这条约束原先只写在 JSDoc 与评审材料里，靠评审人
 * 记住；本脚本把它变成机器判据。
 *
 * 判据：
 *   1. `MaybeAccessor<X>` 的 `X` 不得是函数型类型：`TSFunctionType`（`() => void`）、
 *      `TSConstructorType`（`new () => X`）、函数型类型别名引用（`Accessor` / `Setter` /
 *      `Function` / `CallableFunction` / `NewableFunction`），以及它们的 union / intersection
 *      组合。`Record<string, () => void>` 这类**对象套函数**是合法的（顶层不是函数）。
 *   2. 契约自证：`resolve-value.ts` 的 `MaybeAccessor` 定义必须仍是 `T | Accessor<T>`，
 *      定义形态变了本脚本的判定前提就失效，必须红灯提醒重写判据。
 *   3. 扫描点非空：`packages/core/src` 内必须至少命中 1 处 `MaybeAccessor<...>` 使用，
 *      否则说明扫描根 / 解析器坏了 —— 0 命中一律算假 PASS。
 *
 * 解析器说明：仓库的 `typescript@7` 是 tsgo（Go 原生端口），`import('typescript')` 只导出
 * `version` / `versionMajorMinor`，**没有 `createSourceFile` 等编译器 API**，所以本脚本
 * 用 devDependencies 里已有的 `oxc-parser` 做纯语法层 AST 解析（不需要类型检查器，
 * 判定「顶层类型是不是函数」只看语法结构就够）。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseSync } from 'oxc-parser';

const repoRoot = resolve(import.meta.dirname, '..');
const coreSrc = join(repoRoot, 'packages', 'core', 'src');
const resolveValuePath = join(coreSrc, 'utils', 'resolve-value.ts');
const ACCESSOR_TYPE = 'MaybeAccessor';
const CONTRACT_DEFINITION = `export type ${ACCESSOR_TYPE}<T> = T | Accessor<T>;`;

const errors = [];
const fail = (message) => errors.push(message);

/** 顶层为函数型即违规的类型别名（`Accessor<T>` / Solid `Setter<T>` 都是 `(…) => …`）。 */
const FUNCTION_LIKE_REFERENCES = new Set([
  'Accessor',
  'Setter',
  'Function',
  'CallableFunction',
  'NewableFunction',
  'AnyFunction',
]);

const isFunctionLike = (node) => {
  if (!node || typeof node.type !== 'string') return false;
  switch (node.type) {
    case 'TSFunctionType':
    case 'TSConstructorType':
    case 'TSAbstractConstructorType':
      return true;
    case 'TSParenthesizedType':
      return isFunctionLike(node.typeAnnotation);
    case 'TSUnionType':
    case 'TSIntersectionType':
      return (node.types ?? []).some(isFunctionLike);
    case 'TSTypeReference':
      return (
        node.typeName?.type === 'Identifier' && FUNCTION_LIKE_REFERENCES.has(node.typeName.name)
      );
    default:
      // TSTypeParameter（泛型 T）、TSTypeLiteral（对象）、TSTypeOperator（keyof）、
      // 基础类型 / 字面量 / 元组 / 数组 / 索引访问等，顶层都不是函数。
      return false;
  }
};

/** oxc AST 是无 parent 引用的纯树，递归即可覆盖 .ts / .tsx 全部节点。 */
const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  if (typeof node.type === 'string') visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type') continue;
    walk(value, visit);
  }
};

const lineOf = (source, offset) => source.slice(0, offset).split('\n').length;

const collectFiles = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(abs));
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(abs);
    }
  }
  return files;
};

// 2. 契约自证：定义形态变了，下面的「顶层是不是函数」判定前提就不成立。
if (!existsSync(resolveValuePath)) {
  fail(`访问器契约真源缺失：${relative(repoRoot, resolveValuePath)}`);
} else if (!readFileSync(resolveValuePath, 'utf8').includes(CONTRACT_DEFINITION)) {
  fail(
    `${relative(repoRoot, resolveValuePath)} 的 ${ACCESSOR_TYPE} 定义不再是 \`${CONTRACT_DEFINITION}\`，` +
      '本门禁的判定前提已失效，请同步重写 check-accessors.mjs 的判据',
  );
}

// 1. 逐文件扫描 MaybeAccessor<...> 的类型实参。
const files = collectFiles(coreSrc);
let scanned = 0;
let declarations = 0;
for (const abs of files) {
  const source = readFileSync(abs, 'utf8');
  if (!source.includes(ACCESSOR_TYPE)) continue;
  const parsed = parseSync(abs, source, {
    lang: abs.endsWith('.tsx') ? 'tsx' : 'ts',
    sourceType: 'module',
  });
  for (const error of parsed.errors ?? []) {
    const { message } = /** @type {{ message?: string }} */ (error);
    fail(`${relative(repoRoot, abs)} 解析失败（oxc）：${message || '无 message 字段'}`);
  }
  // 本文件声明的类型参数名（`<T>` / `<TKey, TValue>`）：引用位置是 TSTypeReference 而非
  // TSTypeParameter，所以必须先收集声明，才能把 `MaybeAccessor<T>` 与具体类型区分开。
  const typeParameters = new Set();
  walk(parsed.program, (node) => {
    if (node.type !== 'TSTypeParameter') return;
    const name = typeof node.name === 'string' ? node.name : node.name?.name;
    if (name) typeParameters.add(name);
  });
  walk(parsed.program, (node) => {
    if (node.type !== 'TSTypeReference') return;
    if (node.typeName?.type !== 'Identifier' || node.typeName.name !== ACCESSOR_TYPE) return;
    const argument = node.typeArguments?.params?.[0];
    // 定义处与函数签名里的 `MaybeAccessor<T>`（T 是类型参数）不参与判定，但计数要记下来。
    if (
      !argument ||
      (argument.type === 'TSTypeReference' &&
        argument.typeName?.type === 'Identifier' &&
        typeParameters.has(argument.typeName.name))
    ) {
      declarations += 1;
      return;
    }
    scanned += 1;
    if (!isFunctionLike(argument)) return;
    fail(
      `${relative(repoRoot, abs)}:${lineOf(source, node.start)} ` +
        `${ACCESSOR_TYPE}<${source.slice(argument.start, argument.end).trim()}> 的类型实参是函数型 —— ` +
        '`resolveValue` 用 typeof 区分值与 getter，函数型 T 让两者不可区分；' +
        '需要 getter 时直接写 `Accessor<X>`，否则直接写 `X`',
    );
  });
}

// 3. 扫描点非空：0 命中说明扫描根或解析器失效，属于假 PASS。
if (scanned === 0) {
  fail(
    `${relative(repoRoot, coreSrc)} 内没有扫到任何 ${ACCESSOR_TYPE}<…> 类型实参（仅命中 ${declarations} 处泛型签名），` +
      '扫描根或 AST 解析已失效，判据不成立',
  );
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[check:accessors] ${error}`);
  process.exit(1);
}

console.log(
  `[check:accessors] ${scanned} 处 ${ACCESSOR_TYPE}<…> 类型实参全部是非函数型（扫描 ${files.length} 个源文件）· ` +
    `${declarations} 处泛型签名不参与判定 · 契约定义 ${CONTRACT_DEFINITION.length} 字符在位`,
);
