import { createContext, useContext } from 'solid-js';
import type { UIConfig } from './types';

/** ConfigProvider 注入的全局配置上下文。 */
export const ConfigProviderContext = createContext<UIConfig | undefined>(undefined);

/**
 * 读取最近的 `ConfigProvider` 配置。
 *
 * @throws 未包裹在 `ConfigProvider` 内时抛出错误
 */
export function useConfig(): UIConfig {
  const config = useContext(ConfigProviderContext);
  if (!config) {
    throw new Error('[solid-craft-ui] useConfig() must be used within <ConfigProvider>');
  }
  return config;
}
