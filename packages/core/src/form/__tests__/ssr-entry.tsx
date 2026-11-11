/**
 * T2-02 的 SSR 入口（只被 `spikes/shared/ssr-smoke.mjs` 用）。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 都排除 `__tests__`。
 * 放在这里是为了复用仓库里唯一能做「真实服务端编译 + renderToString」的那条链路。
 *
 * 验三件事：
 *  1. 字段上下文在服务端能正常求值，不出 `document`；
 *  2. `aria-invalid` 恒输出字符串两态（无错误也输出 `'false'`，避免 hydration 属性差）；
 *  3. `aria-describedby` 只在有错误文案时输出。
 */
import { createSignal, type JSX } from 'solid-js';
import { renderToString } from 'solid-js/web';

import { FieldProvider } from '../field-context';
import { toFieldText } from '../field-value';
import { useFormFieldOptional } from '../use-form-field';

function SsrProbe(): JSX.Element {
  const field = useFormFieldOptional();
  if (!field) return <span>no-field</span>;

  return (
    <div
      data-scui-role="form-item"
      data-scui-field={field.name}
      data-scui-invalid={field.status() === 'error' ? 'true' : 'false'}
    >
      <label id={field.ids.label} for={field.ids.control}>
        {field.name}
      </label>
      <input {...field.aria()} value={toFieldText(field.value())} />
      <span id={field.ids.message} data-scui-role="field-error">
        {field.message() ?? ''}
      </span>
    </div>
  );
}

function Harness(): JSX.Element {
  const [city] = createSignal('石家庄');
  const [town] = createSignal('');

  return (
    <form data-scui-role="form" aria-label="表单">
      <FieldProvider name="city" value={city} setValue={() => {}}>
        <SsrProbe />
      </FieldProvider>
      <FieldProvider name="town" value={town} setValue={() => {}} message={() => '请填写区县'}>
        <SsrProbe />
      </FieldProvider>
    </form>
  );
}

/** ssr-smoke 约定：导出 `render()` 返回 HTML 字符串。 */
export const render = (): string => renderToString(() => <Harness />);
