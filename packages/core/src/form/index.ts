/**
 * 表单基座 barrel。
 *
 * ⚠️ 本目录是**内部实现**，暂不从 `src/index.ts` 导出，也没有 `exports` 子路径：
 * 它此刻只有「控件 ↔ 字段」的接缝，公共 API 是 T2-08 的 `<Form>` / `<Form.Item>`
 * 与随之导出的 `useFormField`（自定义控件的接入协议）。提前把半截协议挂到公共出口，
 * 等于冻结一个还没被 Form 用过的契约。
 *
 * 上层组件（Input / Select / Checkbox …）从 `../../form` 引用即可。
 */
export { FieldContext, FieldProvider } from './field-context';
export type { FieldProviderProps } from './field-context';
export { toFieldText } from './field-value';
export { useFormField, useFormFieldOptional } from './use-form-field';
export type { FieldAria, FieldControl, FieldIds, FieldStatus } from './types';
