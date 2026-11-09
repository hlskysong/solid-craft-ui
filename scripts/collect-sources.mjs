import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const EXCLUDED_DIRS = new Set(['__tests__', 'demos', 'node_modules', 'dist']);

/**
 * 收集 src 下所有可发布的 TS/TSX 源文件（相对路径，POSIX 分隔）。
 * 排除测试、Demo、类型声明与样式文件。
 */
export function collectSources(srcDir) {
  const result = [];

  const walk = (dir) => {
    for (const name of readdirSync(dir).toSorted()) {
      if (EXCLUDED_DIRS.has(name)) continue;
      const full = join(dir, name);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(name)) continue;
      if (/\.test\.(ts|tsx)$/.test(name)) continue;
      if (name.endsWith('.d.ts')) continue;
      result.push(relative(srcDir, full).split(sep).join('/'));
    }
  };

  walk(srcDir);
  return result;
}
