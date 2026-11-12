import { createContext, useContext } from 'solid-js';

import { getGlobalApi } from './notice-api';
import type { AppContextValue } from './types';

/** `<App>` 注入的反馈通道上下文。 */
export const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * 读取反馈通道。**脱离 `<App>` 也可用**：没有 Provider 时回落到全局静态 API
 * （第一次调用才惰性创建宿主；SSR 下回落为 no-op 上下文，不触碰 DOM）。
 * `<Form>` 的校验错误因此可以直接 `useApp().message.error(...)`，
 * 也可以完全脱离树 `import { message }` 调用同一个通道。
 */
export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (value) return value;
  return getGlobalApi();
}
