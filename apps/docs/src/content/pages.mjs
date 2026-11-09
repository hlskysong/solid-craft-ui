/**
 * 指南 / 设计页元数据：路由、导航与 Fuse.js 索引的单点定义。
 * 页面正文在 src/pages/Guides.tsx / Design.tsx 中按 slug 渲染。
 */
export const GUIDE_PAGES = [
  {
    slug: 'getting-started',
    title: '快速开始',
    description: '安装、引入 CSS、ConfigProvider 与三端构建器接入。',
    keywords: ['安装', 'install', 'CSS', 'ConfigProvider', 'Vite', 'Webpack', 'Rspack', 'SolidStart', 'SSR'],
  },
];

export const DESIGN_PAGES = [
  {
    slug: 'tokens',
    title: '设计 Token',
    description: 'DTCG 三层结构、分档对比度校验与 CSS 变量命名。',
    keywords: ['DTCG', 'token', 'style-dictionary', 'colorjs', '对比度', 'WCAG'],
  },
  {
    slug: 'color',
    title: '色彩',
    description: 'OKLCH 生成的 6 色相 × 10 级色阶与语义色引用。',
    keywords: ['色阶', 'palette', 'primary', 'OKLCH', '暗色'],
  },
  {
    slug: 'layout',
    title: '布局与间距',
    description: '8px 基准间距、24 栅格与响应式断点。',
    keywords: ['spacing', 'grid', '断点', '响应式'],
  },
  {
    slug: 'motion',
    title: '动效',
    description: '时长 / 缓动 token 与 reduced-motion 约定。',
    keywords: ['duration', 'ease', 'transition', 'animation'],
  },
  {
    slug: 'dark',
    title: '暗色主题',
    description: 'theme-dark.css 的覆盖方式与当前验收边界。',
    keywords: ['dark', 'theme', '暗色', 'ConfigProvider'],
  },
  {
    slug: 'density',
    title: '密度与方向',
    description: 'default / compact 密度与 ltr / rtl 方向的 data-* 契约。',
    keywords: ['compact', 'rtl', 'direction', 'density'],
  },
];

export const CHANGELOG = {
  title: '更新记录',
  description: '变更以 Changesets 为准；此处汇总当前工作区的实施进展。',
};
