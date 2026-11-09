import Color from 'colorjs.io';

/**
 * 03 §3.1 / §11 的对比度分档规则（唯一口径）。
 * 构建期对 semantic 层每个 color token 强制要求 $contrastTier；
 * 漏标、未知档、缺参照背景、缺用途标注、实测不达标一律让构建失败。
 */
export const TIERS = {
  text: { minimum: 4.5, standard: 'WCAG 2.1 1.4.3 正文文本' },
  'large-text': {
    minimum: 3,
    standard: 'WCAG 2.1 1.4.3 大号文本（≥18.66px bold / 24px）',
  },
  auxiliary: {
    minimum: 3,
    requiresUsage: true,
    standard: '03 §3.1 仅非必要辅助信息，禁止用于正文',
  },
  control: {
    minimum: 3,
    standard: 'WCAG 2.1 1.4.11 控件边界 / 图标 / 焦点指示',
  },
  decorative: {
    skip: true,
    requiresUsage: true,
    standard: '03 §3.1 纯装饰，不参与对比度判定，须标注用途',
  },
  disabled: {
    skip: true,
    requiresUsage: true,
    standard: '03 §3.1 禁用态豁免，不得单独承载信息',
  },
  background: { skip: true, standard: '参照背景，不参与对比度判定' },
};

const parseColor = (value) => {
  try {
    return new Color(value);
  } catch {
    return null;
  }
};

/** 半透明前景按 sRGB 与不透明背景混合（与浏览器合成一致），再用 colorjs.io 算 WCAG21。 */
export function wcagContrast(foregroundValue, backgroundValue) {
  const foreground = parseColor(foregroundValue);
  const background = parseColor(backgroundValue);
  if (!foreground || !background) return null;

  let solid = foreground;
  if (foreground.alpha < 1) {
    const alpha = foreground.alpha;
    const fg = foreground.to('srgb').coords;
    const bg = background.to('srgb').coords;
    // 量化到 8-bit，与浏览器 / CSS 实际渲染的半透明合成结果一致
    const channels = fg.map(
      (channel, i) => Math.round((alpha * channel + (1 - alpha) * bg[i]) * 255) / 255,
    );
    solid = new Color('srgb', channels);
  }
  return solid.contrast(background, 'WCAG21');
}

/**
 * @param {object} options
 * @param {string} options.theme 主题名（light / dark / test）
 * @param {Array<{path: string[], $value: string, $type?: string, $contrastTier?: string,
 *   $contrastBg?: string, $contrast?: number, $usage?: string}>} options.tokens
 *   Style Dictionary 解析后的 token 列表（引用已展开为最终色值）
 * @param {Set<string>} options.semanticPaths semantic 层的 token 路径集合（强制分档）
 * @returns {string[]} 错误列表；为空表示通过
 */
export function checkTokens({ theme, tokens, semanticPaths }) {
  const errors = [];
  const byPath = new Map(tokens.map((token) => [token.path.join('.'), token]));

  for (const token of tokens) {
    const path = token.path.join('.');
    const tierName = token.$contrastTier;
    const isSemanticColor = semanticPaths.has(path) && token.$type === 'color';

    if (isSemanticColor && !tierName) {
      errors.push(`${theme} ${path}: semantic color 缺少 $contrastTier（03 §3.1 强制分档）`);
      continue;
    }
    if (!tierName) continue;

    const tier = TIERS[tierName];
    if (!tier) {
      errors.push(
        `${theme} ${path}: 未知 $contrastTier "${tierName}"（可选：${Object.keys(TIERS).join(', ')}）`,
      );
      continue;
    }
    if (tier.requiresUsage && !token.$usage?.trim()) {
      errors.push(`${theme} ${path} [${tierName}]: 缺少 $usage 用途标注（${tier.standard}）`);
    }
    if (tier.skip) continue;

    const backgroundPath = token.$contrastBg;
    if (!backgroundPath) {
      errors.push(`${theme} ${path} [${tierName}]: 缺少 $contrastBg 参照背景`);
      continue;
    }
    const background = byPath.get(backgroundPath);
    if (!background) {
      errors.push(`${theme} ${path} [${tierName}]: 参照背景 ${backgroundPath} 不存在`);
      continue;
    }

    const ratio = wcagContrast(token.$value, background.$value);
    if (ratio === null) {
      errors.push(`${theme} ${path} [${tierName}]: 无法解析颜色值`);
      continue;
    }
    const required = Math.max(tier.minimum, token.$contrast ?? 0);
    // 1e-9 仅吸收浮点往返误差，不掩盖 4.4991:1 这类真实边界缺陷
    if (ratio + 1e-9 < required) {
      errors.push(
        `${theme} ${path} [${tierName}]: ${ratio.toFixed(4)}:1 < ${required}:1（${tier.standard}）`,
      );
    }
  }
  return errors;
}
