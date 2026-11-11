import '@testing-library/jest-dom/vitest';

/**
 * jsdom 不实现 `window.scrollTo`，调用时只打印 "Not implemented" 而不抛错。
 * Kobalte 的弹层在打开 / 关闭恢复滚动位置时会调它（原语层 Dialog 的测试因此刷噪音），
 * 噪音会盖住真正的报错，所以在测试环境里直接置空。
 *
 * 只影响测试环境：不在 `src` 里，不进产物。
 */
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
