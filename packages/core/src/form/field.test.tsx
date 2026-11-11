/**
 * T2-02 表单控件基座实证。
 *
 * 验的是「字段上下文这段接缝」本身：受控链路、a11y 注入、id 三件套、getter 响应式、
 * 以及用错位置时的报错质量。真正的控件（Input / Checkbox…）与 `<Form.Item>` 的 DOM
 * 渲染分别属于 T2-03 / T2-05 与 T2-08，这里用一个最小探针控件顶位 —— 探针走的是
 * 与真实控件完全相同的 `useFormFieldOptional()` + `field.aria()` 协议，
 * 因此它绿就说明「任一控件接入这条路是通的」。
 *
 * SSR 部分（`aria-invalid="false"` 恒输出、id 双渲稳定）由
 * `spikes/shared/ssr-smoke.mjs` 的 T2-02 入口验 —— vitest 跑在 jsdom，做不了真 SSR。
 */
import { cleanup, fireEvent, render } from '@solidjs/testing-library';
import { createRoot, createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FieldProvider } from './field-context';
import { toFieldText } from './field-value';
import { useFormField, useFormFieldOptional } from './use-form-field';

afterEach(cleanup);

/** 故意认错字段的探针：用于验证 name 不匹配时的报错。 */
function WrongProbe(): JSX.Element {
  useFormField('town');
  return <span />;
}

/** 探针控件：与真实控件同一套协议（可选上下文 + aria 一次性 spread）。 */
function FieldProbe(props: { label?: string }): JSX.Element {
  const field = useFormFieldOptional();
  if (!field) return <input data-scui-role="input" value="" readOnly />;

  return (
    <div>
      <label id={field.ids.label} for={field.ids.control}>
        {props.label ?? field.name}
      </label>
      <input
        {...field.aria()}
        data-scui-role="input"
        data-scui-field={field.name}
        value={toFieldText(field.value())}
        disabled={field.disabled()}
        onInput={(event) => field.setValue(event.currentTarget.value)}
      />
      <span id={field.ids.message} data-scui-role="field-error">
        {field.message() ?? ''}
      </span>
    </div>
  );
}

describe('toFieldText：字段值 → 可渲染字符串', () => {
  it('字符串原样返回', () => {
    expect(toFieldText('石家庄')).toBe('石家庄');
    expect(toFieldText('')).toBe('');
  });

  it('数字要显示出来：0 不能被当成空值丢掉', () => {
    expect(toFieldText(0)).toBe('0');
    expect(toFieldText(42)).toBe('42');
  });

  it('其余类型一律空串：布尔 / null / undefined / 对象都不进文本框', () => {
    expect(toFieldText(true)).toBe('');
    expect(toFieldText(null)).toBe('');
    expect(toFieldText(undefined)).toBe('');
    expect(toFieldText({ a: 1 })).toBe('');
  });
});

describe('字段上下文：受控链路', () => {
  it('控件读到的值来自字段，输入写回字段（不落地本地状态）', () => {
    const [value, setValue] = createSignal('石家庄');

    render(() => (
      <FieldProvider name="city" value={value} setValue={(next) => setValue(toFieldText(next))}>
        <FieldProbe />
      </FieldProvider>
    ));

    const input = document.querySelector<HTMLInputElement>('input');
    expect(input?.value).toBe('石家庄');

    fireEvent.input(input!, { target: { value: '邯郸' } });

    expect(value()).toBe('邯郸');
    expect(input?.value).toBe('邯郸');
  });

  it('外部改值立即反映到控件（getter 不是快照）', () => {
    const [value, setValue] = createSignal('a');

    render(() => (
      <FieldProvider name="city" value={value} setValue={() => {}}>
        <FieldProbe />
      </FieldProvider>
    ));

    const input = document.querySelector<HTMLInputElement>('input');
    setValue('b');

    expect(input?.value).toBe('b');
  });

  it('setValue 把值透传给宿主（控件不做类型转换）', () => {
    const setValue = vi.fn();
    const [value] = createSignal('');

    render(() => (
      <FieldProvider name="city" value={value} setValue={setValue}>
        <FieldProbe />
      </FieldProvider>
    ));

    fireEvent.input(document.querySelector('input')!, { target: { value: '唐山' } });
    expect(setValue).toHaveBeenCalledWith('唐山');
  });

  it('两个字段各自独立：id 不同源、值互不串扰', () => {
    const [city, setCity] = createSignal('石家庄');
    const [town, setTown] = createSignal('');

    render(() => (
      <>
        <FieldProvider name="city" value={city} setValue={(next) => setCity(toFieldText(next))}>
          <FieldProbe />
        </FieldProvider>
        <FieldProvider name="town" value={town} setValue={(next) => setTown(toFieldText(next))}>
          <FieldProbe />
        </FieldProvider>
      </>
    ));

    const inputs = [...document.querySelectorAll<HTMLInputElement>('input')];
    expect(inputs).toHaveLength(2);
    expect(inputs[0]?.id).not.toBe(inputs[1]?.id);
    expect(inputs[0]?.getAttribute('aria-labelledby')).not.toBe(
      inputs[1]?.getAttribute('aria-labelledby'),
    );

    fireEvent.input(inputs[1]!, { target: { value: '邯郸' } });
    expect(city()).toBe('石家庄');
    expect(town()).toBe('邯郸');
  });
});

describe('字段上下文：a11y 与 id 注入', () => {
  it('无错误时 aria-invalid="false" 且不输出 aria-describedby', () => {
    const [value] = createSignal('');

    render(() => (
      <FieldProvider name="city" value={value} setValue={() => {}}>
        <FieldProbe />
      </FieldProvider>
    ));

    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('有错误文案时 aria-invalid="true" 且 aria-describedby 指向错误元素', () => {
    const [value] = createSignal('');

    render(() => (
      <FieldProvider name="city" value={value} setValue={() => {}} message={() => '请填写城市'}>
        <FieldProbe />
      </FieldProvider>
    ));

    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('请填写城市');
  });

  it('label[for] / aria-labelledby / 控件 id 三者同源', () => {
    const [value] = createSignal('');

    render(() => (
      <FieldProvider name="city" value={value} setValue={() => {}}>
        <FieldProbe label="城市" />
      </FieldProvider>
    ));

    const input = document.querySelector('input')!;
    const label = document.querySelector('label')!;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
  });

  it('宿主可覆盖 id 三件套（Form.Item 需要先渲染 label 再挂控件）', () => {
    const [value] = createSignal('');

    render(() => (
      <FieldProvider
        name="city"
        value={value}
        setValue={() => {}}
        ids={{ control: 'f-city', label: 'f-city-label', message: 'f-city-message' }}
        message={() => '必填'}
      >
        <FieldProbe />
      </FieldProvider>
    ));

    const input = document.querySelector('input')!;
    expect(input.id).toBe('f-city');
    expect(input.getAttribute('aria-labelledby')).toBe('f-city-label');
    expect(input.getAttribute('aria-describedby')).toBe('f-city-message');
  });

  it('显式 status 优先于「有文案即 error」的缺省推导', () => {
    const [value] = createSignal('');

    render(() => (
      <FieldProvider
        name="city"
        value={value}
        setValue={() => {}}
        message={() => '提示文案'}
        status={() => 'default'}
      >
        <FieldProbe />
      </FieldProvider>
    ));

    expect(document.querySelector('input')).toHaveAttribute('aria-invalid', 'false');
  });

  it('disabled 是 getter：宿主改状态后控件跟着变', () => {
    const [value] = createSignal('');
    const [disabled, setDisabled] = createSignal(false);

    render(() => (
      <FieldProvider name="city" value={value} setValue={() => {}} disabled={disabled}>
        <FieldProbe />
      </FieldProvider>
    ));

    const input = document.querySelector('input')!;
    expect(input).not.toBeDisabled();

    setDisabled(true);
    expect(input).toBeDisabled();
  });
});

describe('useFormField / useFormFieldOptional 的位置契约', () => {
  it('上下文缺失时抛明确错误：指出字段名与替代方案', () => {
    createRoot((dispose) => {
      expect(() => useFormField('city')).toThrow(
        /useFormField\('city'\) 必须在 <Form\.Item> 内使用/,
      );
      expect(() => useFormField('city')).toThrow(/useFormFieldOptional\(\)/);
      dispose();
    });
  });

  it('字段名不匹配时抛错，并同时报出两边的名字', () => {
    const [value] = createSignal('');
    let caught: unknown;

    try {
      render(() => (
        <FieldProvider name="city" value={value} setValue={() => {}}>
          <WrongProbe />
        </FieldProvider>
      ));
    } catch (error) {
      caught = error;
    }

    expect(String(caught)).toMatch(
      /字段名不匹配：控件请求 "town"，实际所在的 <Form\.Item> 是 "city"/,
    );
  });

  it('useFormFieldOptional 在 Provider 外返回 undefined，控件可独立使用', () => {
    render(() => <FieldProbe />);

    const input = document.querySelector('input')!;
    expect(input).toBeInTheDocument();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.id).toBe('');
  });

  it('useFormField 在字段内返回同一个 FieldControl（含 name / ids / aria）', () => {
    const [value] = createSignal('x');
    let seen: ReturnType<typeof useFormField> | undefined;

    function StrictProbe(): JSX.Element {
      seen = useFormField('city');
      return <span />;
    }

    render(() => (
      <FieldProvider name="city" value={value} setValue={() => {}}>
        <StrictProbe />
      </FieldProvider>
    ));

    expect(seen?.name).toBe('city');
    expect(seen?.value()).toBe('x');
    expect(seen?.aria().id).toBe(seen?.ids.control);
  });
});
