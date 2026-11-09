import assert from 'node:assert/strict';
import test from 'node:test';
import { checkTokens, TIERS, wcagContrast } from './contrast.mjs';

const token = (path, $value, extra = {}) => ({
  path: path.split('.'),
  $value,
  $type: 'color',
  ...extra,
});

const background = () => token('color.bg.surface', '#ffffff', { $contrastTier: 'background' });

/** semantic 层全部 color token 都受强制分档约束，与 build.mjs 的口径一致。 */
const run = (tokens) =>
  checkTokens({
    theme: 'test',
    tokens,
    semanticPaths: new Set(tokens.map((item) => item.path.join('.'))),
  });

const withTier = (value, tier, extra = {}) =>
  run([
    background(),
    token('color.subject', value, {
      $contrastTier: tier,
      $contrastBg: 'color.bg.surface',
      ...extra,
    }),
  ]);

const fails = (errors, fragment) =>
  assert.ok(
    errors.some((error) => error.includes(fragment)),
    `期望包含「${fragment}」的错误，实际：${JSON.stringify(errors)}`,
  );

void test('03 §3.1 分档表覆盖正文 / 大文本 / 辅助信息 / 控件 / 装饰 / 禁用', () => {
  assert.deepEqual(Object.keys(TIERS), [
    'text',
    'large-text',
    'auxiliary',
    'control',
    'decorative',
    'disabled',
    'background',
  ]);
  assert.equal(TIERS.text.minimum, 4.5);
  assert.equal(TIERS['large-text'].minimum, 3);
  assert.equal(TIERS.auxiliary.minimum, 3);
  assert.equal(TIERS.control.minimum, 3);
});

void test('§11.3 回归：#2f6bff 对白底 4.4990:1 必须让构建失败', () => {
  const ratio = wcagContrast('#2f6bff', '#ffffff');
  assert.ok(ratio > 4.49 && ratio < 4.5);
  fails(withTier('#2f6bff', 'text'), ':1 < 4.5:1');
});

void test('达标色 #2d66f5（4.8492:1）通过 text 档', () => {
  assert.equal(withTier('#2d66f5', 'text').length, 0);
});

void test('semantic color 漏标 tier 直接报错（上一轮 28 个 axe 违规的根因）', () => {
  fails(run([background(), token('color.primary', '#2d66f5')]), '缺少 $contrastTier');
});

void test('缺 $contrastBg / 参照背景不存在 / 未知档位 均报错', () => {
  fails(withTier('#2d66f5', 'text', { $contrastBg: undefined }), '缺少 $contrastBg');
  fails(withTier('#2d66f5', 'text', { $contrastBg: 'color.bg.missing' }), '不存在');
  fails(withTier('#2d66f5', 'typo'), '未知 $contrastTier');
});

void test('control 档：3.0335:1 通过，2.8139:1 失败（WCAG 1.4.11）', () => {
  assert.equal(withTier('#949494', 'control').length, 0);
  fails(withTier('#9a9a9a', 'control'), '< 3:1');
});

void test('large-text 档：3.0722:1 通过，同色标 text 档失败', () => {
  assert.equal(withTier('#939393', 'large-text').length, 0);
  fails(withTier('#939393', 'text'), '< 4.5:1');
});

void test('auxiliary / decorative / disabled 必须标注 $usage', () => {
  fails(withTier('#9a9a9a', 'auxiliary'), '缺少 $usage');
  fails(withTier('#9a9a9a', 'decorative'), '缺少 $usage');
  fails(withTier('#9a9a9a', 'disabled'), '缺少 $usage');
  // auxiliary 仍需 ≥3:1：#9a9a9a 只有 2.8139:1
  fails(withTier('#9a9a9a', 'auxiliary', { $usage: '仅非必要辅助提示' }), '< 3:1');
  assert.equal(
    withTier('#949494', 'auxiliary', { $usage: '仅非必要辅助提示，禁止用于正文' }).length,
    0,
  );
  assert.equal(withTier('#9a9a9a', 'decorative', { $usage: '纯装饰分割线' }).length, 0);
  assert.equal(withTier('#9a9a9a', 'disabled', { $usage: '禁用态，不单独承载信息' }).length, 0);
});

void test('半透明前景按 sRGB 合成后再算对比度', () => {
  assert.ok(Math.abs(wcagContrast('rgba(0, 0, 0, 0.55)', '#ffffff') - 4.7417) < 0.01);
  assert.equal(withTier('rgba(0, 0, 0, 0.55)', 'text').length, 0);
  fails(withTier('rgba(0, 0, 0, 0.45)', 'text'), '< 4.5:1');
});

void test('$contrast 可显式提高门槛，不能降低档位下限', () => {
  fails(withTier('#2d66f5', 'text', { $contrast: 7 }), '< 7:1');
});
