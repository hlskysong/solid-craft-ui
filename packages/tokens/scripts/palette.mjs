import Color from 'colorjs.io';

/**
 * 03 §3.1 色板：6 个色相 × 10 级（1 最浅 → 10 最深），构建期在 OKLCH 空间生成。
 * 第 6 级恒等于品牌基准色（主色），其余级别以第 6 级的 L / C 为锚均匀展开，
 * 再经 toGamut() 收敛到 sRGB，输出稳定 hex 供运行时使用。
 * 亮 / 暗各生成一套，暗色基准本身已提高亮度、降低饱和度（03 §3.3）。
 */

export const HUES = ['blue', 'green', 'amber', 'red', 'cyan', 'neutral'];

export const BASES = {
  light: {
    blue: '#2d66f5',
    green: '#15803d',
    amber: '#b45309',
    red: '#dc2626',
    cyan: '#0e7490',
    neutral: '#808080',
  },
  dark: {
    blue: '#5b8cff',
    green: '#4ade80',
    amber: '#fbbf24',
    red: '#f87171',
    cyan: '#22d3ee',
    neutral: '#8a8a8a',
  },
};

// 相对第 6 级的 OKLCH 亮度偏移（1 → 10）
const L_OFFSETS = [0.35, 0.28, 0.21, 0.14, 0.07, 0, -0.07, -0.14, -0.21, -0.28];
// 彩度缩放：浅端收敛避免超出 sRGB 色域
const C_SCALES = [0.35, 0.5, 0.65, 0.8, 0.92, 1, 0.98, 0.94, 0.88, 0.8];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const levelUsage = (level) => {
  if (level <= 3) return '浅背景 / 边框';
  if (level <= 5) return 'hover / 浅色强调';
  if (level === 6) return '主色';
  if (level <= 8) return 'active / 深色强调';
  return '深色文本 / 暗色背景';
};

/** @returns {Record<string, Record<string, {$type: string, $value: string, $description: string}>>} */
export function buildPalette(theme) {
  const bases = BASES[theme];
  if (!bases) throw new Error(`[palette] unknown theme: ${theme}`);

  const palette = {};
  for (const hue of HUES) {
    const [baseLightness, chroma, hueAngle] = new Color(bases[hue]).to('oklch').coords;
    const levels = {};
    for (let level = 1; level <= 10; level += 1) {
      const index = level - 1;
      const lightness = clamp(baseLightness + L_OFFSETS[index], 0.08, 0.98);
      const color = new Color('oklch', [lightness, chroma * C_SCALES[index], hueAngle])
        .to('srgb')
        .toGamut();
      levels[String(level)] = {
        $type: 'color',
        // 第 6 级必须精确等于品牌基准，避免浮点往返引入色差
        $value: level === 6 ? bases[hue] : color.toString({ format: 'hex' }),
        $description: `${hue}-${level}：${levelUsage(level)}（${theme}）`,
      };
    }
    palette[hue] = levels;
  }
  return { color: { palette } };
}
