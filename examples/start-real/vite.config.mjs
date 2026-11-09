import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { solidStart } from '@solidjs/start/config';
import { defineConfig } from 'vite';

/**
 * 真实 @solidjs/start 2.2.x 是 Vite-native（不再使用 vinxi / app.config.ts）。
 * solidStart() 会注入 resolve.externalConditions: ['solid', 'node']，
 * 这正是本冒烟要验证的 "solid" 条件解析链路。
 */
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));
const seenByEnv = new Map();

/** 按 Vite environment 记录实际纳入的 solid-craft 模块路径。 */
const recordCoreResolution = {
  name: 'record-core-resolution',
  moduleParsed(info) {
    if (!info.id.includes('core/dist')) return;
    const env = this.environment?.name ?? 'unknown';
    const seen = seenByEnv.get(env) ?? new Set();
    seen.add(info.id);
    seenByEnv.set(env, seen);
  },
  closeBundle() {
    const env = this.environment?.name ?? 'unknown';
    const files = [...(seenByEnv.get(env) ?? [])].toSorted((a, b) => a.localeCompare(b));
    mkdirSync(distDir, { recursive: true });
    writeFileSync(`${distDir}resolved.${env}.json`, `${JSON.stringify(files, null, 2)}\n`);
  },
};

export default defineConfig({
  plugins: [solidStart({ ssr: true, devOverlay: false }), recordCoreResolution],
});
