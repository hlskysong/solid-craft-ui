import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';
import { compile } from 'sass';

/**
 * CSS 构建：tokens.css + base.scss → base.css；逐组件 SCSS → components/*.css；
 * 拼接 → index.css；reset.scss → reset.css。CSS 不进 JS，由消费方显式引入。
 */
const repoRoot = resolve(import.meta.dirname, '..');
const coreDir = join(repoRoot, 'packages', 'core');
const srcStyles = join(coreDir, 'src', 'styles');
const componentsDir = join(coreDir, 'src', 'components');
const outDir = join(coreDir, 'dist', 'styles');
const tokensCssPath = join(repoRoot, 'packages', 'tokens', 'dist', 'css', 'tokens.css');

if (!existsSync(tokensCssPath)) {
  throw new Error(`[build-css] missing ${tokensCssPath}; build solid-craft-tokens first`);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'components'), { recursive: true });

const processor = postcss([
  autoprefixer({ overrideBrowserslist: ['chrome >= 128', 'last 2 versions', 'not dead'] }),
  postcssPresetEnv({
    stage: 3,
    features: { 'custom-properties': false },
  }),
]);

const emit = async (relativePath, css) => {
  const dest = join(outDir, relativePath);
  const result = await processor.process(css, { from: dest, to: dest });
  writeFileSync(dest, `${result.css}\n`);
};

const tokensCss = readFileSync(tokensCssPath, 'utf8');
const sassOptions = { style: 'expanded', loadPaths: [srcStyles] };
const baseCss = compile(join(srcStyles, 'base.scss'), sassOptions).css;
const resetCss = compile(join(srcStyles, 'reset.scss'), sassOptions).css;

await emit('base.css', `${tokensCss}\n${baseCss}`);
await emit('reset.css', resetCss);

const componentCss = [];
if (existsSync(componentsDir)) {
  for (const entry of readdirSync(componentsDir, { withFileTypes: true }).toSorted((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (!entry.isDirectory()) continue;
    const scss = join(componentsDir, entry.name, `${entry.name}.scss`);
    if (!existsSync(scss)) continue;
    const css = compile(scss, sassOptions).css;
    await emit(`components/${entry.name}.css`, css);
    componentCss.push(css);
  }
}

await emit('index.css', [tokensCss, baseCss, ...componentCss].join('\n'));
console.log(
  `[build-css] base.css / reset.css / index.css + ${componentCss.length} component stylesheets`,
);
