/**
 * 包基名与 CSS 前缀的运行时单点定义。
 * 构建侧来源为 `scripts/scope.mjs`，两者由 `scripts/check-exports.mjs` 强制校验一致。
 */

/** 主 npm 包名（D-01 正式命名；保留 UI_SCOPE 导出名以维持公共 API 稳定） */
export const UI_SCOPE = 'solid-craft';

/** 组件 CSS 类名前缀；CSS 变量 / 配置属性前缀由它派生，避免第二套硬编码 */
export const CSS_PREFIX = 'scui-';
