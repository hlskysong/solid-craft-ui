/**
 * 从本地缓存的上游包里抽取设计数值，产出 raw/upstream-values.json。
 *
 * 前置：node reference/design-baseline/fetch-upstream.mjs（下载 + 解包到 .cache/）
 * 用法：node reference/design-baseline/refresh.mjs
 *
 * 只做「取值 + 记录出处」，不做判定 —— 判定（一致 / 刻意偏离 / 待裁决 / 缺口）
 * 写在 compare.json 里，因为那需要理由，机器给不出。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = import.meta.dirname;
const cache = join(root, '.cache');

const read = (relative) => {
  const file = join(cache, relative);
  if (!existsSync(file)) throw new Error(`缺少缓存文件：${relative}（先跑 fetch-upstream.mjs）`);
  return readFileSync(file, 'utf8');
};

/** 从文本里按正则抓第一个分组 */
const pick = (text, pattern, label) => {
  const matched = text.match(pattern);
  if (!matched?.[1]) throw new Error(`未匹配到 ${label}`);
  return matched[1].trim();
};

/** 把 `--td-x: value;` 形式的 CSS 变量解析成 Map */
const parseCssVars = (text) => {
  const map = new Map();
  for (const [, name, value] of text.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    if (!map.has(name)) map.set(name, value.trim());
  }
  return map;
};

/** 把 `$name: value;` 形式的 SCSS 变量解析成 Map（同名取第一处，即亮色段） */
const parseScssVars = (text) => {
  const map = new Map();
  for (const [, name, value] of text.matchAll(/^\$([\w-]+)\s*:\s*([^;]+);/gm)) {
    if (!map.has(name)) map.set(name, value.trim());
  }
  return map;
};

// ---------- Ant Design ----------
const antdSeed = read('antd/es/theme/themes/seed.js');
const antd = {
  version: '6.7.0',
  source:
    'antd/es/theme/themes/seed.js + shared/genSizeMapToken.js|genRadius.js|genCommonMapToken.js',
  colorPrimary: pick(antdSeed, /colorPrimary:\s*'([^']+)'/, 'colorPrimary'),
  colorSuccess: pick(antdSeed, /colorSuccess:\s*'([^']+)'/, 'colorSuccess'),
  colorWarning: pick(antdSeed, /colorWarning:\s*'([^']+)'/, 'colorWarning'),
  colorError: pick(antdSeed, /colorError:\s*'([^']+)'/, 'colorError'),
  fontSize: Number(pick(antdSeed, /fontSize:\s*(\d+)/, 'fontSize')),
  borderRadius: Number(pick(antdSeed, /borderRadius:\s*(\d+)/, 'borderRadius')),
  controlHeight: Number(pick(antdSeed, /controlHeight:\s*(\d+)/, 'controlHeight')),
  lineWidth: Number(pick(antdSeed, /lineWidth:\s*(\d+)/, 'lineWidth')),
  sizeStep: Number(pick(antdSeed, /sizeStep:\s*(\d+)/, 'sizeStep')),
  sizeUnit: Number(pick(antdSeed, /sizeUnit:\s*(\d+)/, 'sizeUnit')),
};
// 派生：公式取自 shared/genControlHeight.js 与 shared/genRadius.js（borderRadius=6）
antd.controlHeightScale = {
  small: antd.controlHeight * 0.75,
  medium: antd.controlHeight,
  large: antd.controlHeight * 1.25,
};
// 严格照搬 shared/genSizeMapToken.js 的九档定义（sizeUnit=4 / sizeStep=4）
antd.sizeScale = {
  xxs: antd.sizeUnit * (antd.sizeStep - 3), // 4
  xs: antd.sizeUnit * (antd.sizeStep - 2), // 8
  sm: antd.sizeUnit * (antd.sizeStep - 1), // 12
  base: antd.sizeUnit * antd.sizeStep, // 16（size / sizeMS 同值）
  md: antd.sizeUnit * (antd.sizeStep + 1), // 20
  lg: antd.sizeUnit * (antd.sizeStep + 2), // 24
  xl: antd.sizeUnit * (antd.sizeStep + 4), // 32
  xxl: antd.sizeUnit * (antd.sizeStep + 8), // 48
};
antd.radiusScale = { xs: 2, sm: 4, base: antd.borderRadius, lg: antd.borderRadius + 2, outer: 4 };
antd.motionDuration = { fast: '100ms', mid: '200ms', slow: '300ms' };
antd.textAlpha = {
  primary: 0.88,
  secondary: 0.65,
  tertiary: 0.45,
  disabled: 0.25,
};
antd.border = {
  control: '#d9d9d9（colorBorder = 白底混 15% 黑）',
  split: '#f0f0f0（colorBorderSecondary = 3%）',
};
antd.shadowLayers = 3;

// ---------- TDesign ----------
const tdesignCss = read('tdesign-vue-next/es/style/index.css');
const tdVars = parseCssVars(tdesignCss);
/** TDesign 组件尺寸是 `var(--td-size-N)` 引用，这里解析成 px 便于对照 */
const resolveTdSize = (value) => {
  const matched = /var\(--td-size-(\d+)\)/.exec(value ?? '');
  return matched ? tdVars.get(`td-size-${matched[1]}`) : value;
};
const tdesign = {
  version: 'tdesign-vue-next 1.20.11 / tdesign-common main',
  source: 'tdesign-vue-next/es/style/index.css（--td-*）+ tdesign-common/style/web/_variables.less',
  brandColor6: tdVars.get('td-brand-color-6'),
  brandColor5: tdVars.get('td-brand-color-5'),
  sizeScale: Object.fromEntries(
    [...Array(16)].map((_, index) => {
      const step = index + 1;
      return [step, tdVars.get(`td-size-${step}`)];
    }),
  ),
  controlHeight: {
    small: resolveTdSize(tdVars.get('td-comp-size-xs')),
    medium: resolveTdSize(tdVars.get('td-comp-size-m')),
    large: resolveTdSize(tdVars.get('td-comp-size-xl')),
  },
  radiusScale: {
    small: tdVars.get('td-radius-small'),
    base: tdVars.get('td-radius-default'),
    medium: tdVars.get('td-radius-medium'),
    large: tdVars.get('td-radius-large'),
  },
  fontSizes: {
    bodySmall: tdVars.get('td-font-size-body-small'),
    bodyMedium: tdVars.get('td-font-size-body-medium'),
    bodyLarge: tdVars.get('td-font-size-body-large'),
  },
  textColors: {
    primary: tdVars.get('td-font-gray-1'),
    secondary: tdVars.get('td-font-gray-2'),
    placeholder: tdVars.get('td-font-gray-3'),
    disabled: tdVars.get('td-font-gray-4'),
  },
  borderColors: { level1: tdVars.get('td-gray-color-3'), level2: tdVars.get('td-gray-color-4') },
  shadowLayers: 3,
};

// ---------- Semi Design ----------
const semiTheme = read('semi-theme-default/scss/variables.scss');
const semiGlobal = read('semi-theme-default/scss/global.scss');
const semiVars = parseScssVars(semiTheme);
const semi = {
  version: '2.104.0',
  source: '@douyinfe/semi-theme-default/scss/{variables,global}.scss',
  colorPrimary: 'rgba(0, 100, 250, 1)（--semi-blue-5 = 0,100,250）',
  controlHeight: {
    small: semiVars.get('height-control-small'),
    medium: semiVars.get('height-control-default'),
    large: semiVars.get('height-control-large'),
  },
  spacingScale: [
    semiVars.get('spacing-super-tight'),
    semiVars.get('spacing-extra-tight'),
    semiVars.get('spacing-tight'),
    semiVars.get('spacing-base-tight'),
    semiVars.get('spacing-base'),
    semiVars.get('spacing-base-loose'),
    semiVars.get('spacing-loose'),
    semiVars.get('spacing-extra-loose'),
    semiVars.get('spacing-super-loose'),
  ],
  radiusScale: {
    small: pick(semiGlobal, /--semi-border-radius-small:\s*([^;]+);/, 'radius-small'),
    medium: pick(semiGlobal, /--semi-border-radius-medium:\s*([^;]+);/, 'radius-medium'),
    large: pick(semiGlobal, /--semi-border-radius-large:\s*([^;]+);/, 'radius-large'),
  },
  fontSizes: {
    small: semiVars.get('font-size-small'),
    regular: semiVars.get('font-size-regular'),
    header6: semiVars.get('font-size-header-6'),
    header5: semiVars.get('font-size-header-5'),
    header4: semiVars.get('font-size-header-4'),
  },
  textAlpha: { primary: 1, secondary: 0.8, tertiary: 0.62, disabled: 0.35 },
  borderThickness: semiVars.get('border-thickness-control'),
  shadowLayers: 3,
};

const output = {
  generatedAt: new Date().toISOString(),
  note: '由 refresh.mjs 从 .cache/ 内上游包抽取，数值出处见各 source 字段；判定见 compare.json。',
  antd,
  tdesign,
  semi,
};

writeFileSync(
  join(root, 'raw', 'upstream-values.json'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
);
console.log('[design-baseline] 已生成 raw/upstream-values.json');
console.log(
  `  antd      ${antd.colorPrimary} / ${antd.fontSize}px / r${antd.borderRadius} / h${antd.controlHeight}`,
);
console.log(
  `  tdesign   ${tdesign.brandColor6} / ${tdesign.fontSizes.bodyMedium} / r${tdesign.radiusScale.base}`,
);
console.log(`  semi      blue-5 / ${semi.fontSizes.regular} / r${semi.radiusScale.small}`);
