import { createContext, createSignal, useContext } from 'solid-js';
import type { Accessor, JSX } from 'solid-js';

/**
 * 文档站全局显示设置：主题 / 密度 / 方向。
 *
 * 契约真实生效（写入 ConfigProvider → `data-scui-*`）；但按 06 §5.3 分档，
 * dark / compact / rtl 的完整视觉回归属于 v1.0，MVP 只验收 light / default / ltr。
 * 界面上如实标注，避免把「可切换」误读为「已验收」。
 */
export type ThemeSetting = 'light' | 'dark';
export type DensitySetting = 'default' | 'compact';
export type DirectionSetting = 'ltr' | 'rtl';

interface DocSettings {
  theme: Accessor<ThemeSetting>;
  density: Accessor<DensitySetting>;
  direction: Accessor<DirectionSetting>;
  setTheme: (value: ThemeSetting) => void;
  setDensity: (value: DensitySetting) => void;
  setDirection: (value: DirectionSetting) => void;
}

/** `<select>` 的 value 是 string，用类型守卫收敛，避免类型断言。 */
export const isThemeSetting = (value: string): value is ThemeSetting =>
  value === 'light' || value === 'dark';
export const isDensitySetting = (value: string): value is DensitySetting =>
  value === 'default' || value === 'compact';
export const isDirectionSetting = (value: string): value is DirectionSetting =>
  value === 'ltr' || value === 'rtl';

const SettingsContext = createContext<DocSettings>();

export function SettingsProvider(props: { children?: JSX.Element }) {
  const [theme, setTheme] = createSignal<ThemeSetting>('light');
  const [density, setDensity] = createSignal<DensitySetting>('default');
  const [direction, setDirection] = createSignal<DirectionSetting>('ltr');

  return (
    <SettingsContext.Provider
      value={{ theme, density, direction, setTheme, setDensity, setDirection }}
    >
      {props.children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): DocSettings {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('[docs] useSettings 必须在 SettingsProvider 内使用');
  return value;
}
