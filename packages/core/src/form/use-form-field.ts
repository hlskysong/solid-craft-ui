/**
 * 控件侧读取字段上下文的唯一入口（T2-02）。
 *
 * 两个形态，差别只在「用错位置时怎么办」：
 *  - `useFormField(name)`：控件**必须**在字段里。代价是位置错了就得立刻炸，
 *    而不是静默渲染出一个不受表单控制的输入框（那类 bug 只在提交时才发现，最难查）。
 *  - `useFormFieldOptional()`：控件既能在 `<Form.Item>` 里受控，也能独立挂在页面上
 *    （例如只做展示的搜索框）。返回 `undefined` 时由控件回落到自己的 props。
 *
 * 为什么还要求传 `name`：错误信息要能指名道姓 —— 「useFormField 必须在 Form.Item 内使用」
 * 在几十个字段的表单里等于没说。顺带把「控件认领的字段」与「实际所在的字段」比一次，
 * 复制粘贴改漏 name 的接线错误会在挂载瞬间暴露，而不是等人肉点一遍表单。
 */
import { useContext } from 'solid-js';

import { FieldContext } from './field-context';
import type { FieldControl } from './types';

/**
 * 取当前字段；不在字段内或字段名不匹配时抛错。
 *
 * @param name 调用方期望的字段名（与 `<Form.Item name>` 同值）
 * @returns 字段控制对象（值 / 状态 / 禁用 / id / a11y 全是 getter）
 * @throws 上下文缺失，或 `name` 与所在字段不一致
 */
export function useFormField(name: string): FieldControl {
  const field = useContext(FieldContext);

  if (!field) {
    throw new Error(
      `[solid-craft] useFormField('${name}') 必须在 <Form.Item> 内使用：` +
        '上下文缺失会让控件的值、校验态与 aria 属性全部脱离表单。' +
        '若该控件需要同时支持独立使用，请改用 useFormFieldOptional()。',
    );
  }

  if (field.name !== name) {
    throw new Error(
      `[solid-craft] 字段名不匹配：控件请求 "${name}"，实际所在的 <Form.Item> 是 "${field.name}"。`,
    );
  }

  return field;
}

/**
 * 取当前字段；不在字段内时返回 `undefined`，由控件决定回落逻辑。
 *
 * @returns 字段控制对象，或 `undefined`（独立使用场景）
 */
export function useFormFieldOptional(): FieldControl | undefined {
  return useContext(FieldContext);
}
