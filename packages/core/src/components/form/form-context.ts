/**
 * `<Form>` → `<Form.Item>` 的上下文（T2-08）。
 *
 * 与 `src/form/field-context.tsx` 的分工：这里下发**表单级配置**（引擎、布局、禁用、
 * label 宽度、冒号、必填标记），`FieldProvider` 下发**字段级状态**（值、错误、aria）。
 * 两层不合并，是因为 T2-02 的控件已经只认 `FieldContext`；把它换成表单上下文会让
 * 所有已落地控件返工，而表单级配置对独立控件毫无意义。
 */
import { createContext, useContext, type Accessor } from 'solid-js';

import type { FormEngine } from './form-instance';
import type { FormLayout } from './types';

export interface FormContextValue {
  engine: FormEngine;
  layout: Accessor<FormLayout>;
  disabled: Accessor<boolean>;
  labelWidth: Accessor<string | undefined>;
  colon: Accessor<boolean>;
  requiredMark: Accessor<boolean>;
}

/** 默认值 `undefined`，让「用错位置」与「合法缺省」可区分。 */
export const FormContext = createContext<FormContextValue>();

export function useFormContext(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error(
      '[solid-craft] <Form.Item> 必须在 <Form> 内使用：脱离表单后字段没有值源、' +
        '校验规则与错误滚动目标。若只需要 label 与布局，请自行组合原生元素。',
    );
  }
  return context;
}
