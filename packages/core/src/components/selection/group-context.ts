/**
 * Group 上下文（T2-05）。
 *
 * 两个 Context 分开而不是共用一个：`CheckboxGroup` 的值是 `string[]`，
 * `RadioGroup` 是 `string`，共用一个 `unknown` 上下文会让每个子项都先做类型断言，
 * 把 R3 之后「字段值才是 unknown」的收窄点从一处扩散到每个控件。
 *
 * 默认值是 `undefined`：子项既能在 Group 内受控，也能独立挂在页面上，
 * 这两种用法靠 `useContext()` 是否有值区分，不需要额外传一个 `inGroup` 布尔。
 */
import { createContext } from 'solid-js';

import type { CheckboxGroupControl, RadioGroupControl } from './selection-types';

/** CheckboxGroup → 子 Checkbox。 */
export const CheckboxGroupContext = createContext<CheckboxGroupControl>();

/** RadioGroup → 子 Radio。 */
export const RadioGroupContext = createContext<RadioGroupControl>();
