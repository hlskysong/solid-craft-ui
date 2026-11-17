/**
 * `Upload` 单测（T3-13）。
 *
 * 重点不是「文件列表渲染出来了」，而是五件能被机器证伪的事：
 * ① `data-scui-status` 恒输出且 `data-scui-invalid` 恒两态；② 受控时点击只发
 * onChange、DOM 不自行回弹；③ `customRequest` 的 onProgress / onSuccess / onError
 * 真的驱动状态机；④ 删除 / 取消 / 重试三条链各自只走单一出口；
 * ⑤ `<Form.Item>` 接管 `fileList`，提交拿到的是变更后的列表。
 *
 * 真实浏览器里的点击选择、拖拽与 axe 扫描在 browser.spec.ts 验；
 * 这里用 jsdom 的 File + 原生事件把状态机钉死。
 */
import { cleanup, fireEvent, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Form, useForm, type FormValues } from '../form';
import { Upload } from './Upload';
import type { UploadFile, UploadRequestOptions } from './types';

afterEach(cleanup);

const seed = (): UploadFile[] => [
  { uid: 'a', name: 'plan-a.pdf', size: 2048, status: 'done', percent: 100 },
  { uid: 'b', name: 'plan-b.pdf', size: 4096, status: 'error', error: '网络中断' },
  { uid: 'c', name: 'plan-c.pdf', size: 1024, status: 'uploading', percent: 40 },
];

const root = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="upload"]');
const items = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('[data-scui-role="upload-item"]'),
];
const itemAt = (index: number): HTMLElement => items()[index]!;
const actionAt = (index: number, role: string): HTMLElement =>
  itemAt(index).querySelector<HTMLElement>(`[data-scui-role="${role}"]`)!;
const input = (): HTMLInputElement =>
  document.querySelector<HTMLInputElement>('[data-scui-role="upload-input"]')!;
const trigger = (): HTMLElement =>
  document.querySelector<HTMLElement>('[data-scui-role="upload-trigger"]')!;
const makeFile = (name = 'demo.txt', length = 10, type = 'text/plain'): File =>
  new File(['x'.repeat(length)], name, { type });
const select = (files: File[]): void => {
  Object.defineProperty(input(), 'files', { configurable: true, value: files });
  fireEvent.change(input());
};

describe('Upload：静态骨架与状态属性', () => {
  it('根节点恒输出 invalid 两态，可访问名称落在 labelable 控件上', () => {
    render(() => <Upload />);
    // generic div 上不许挂 role / aria-label（Biome useSemanticElements +
    // axe aria-prohibited-attr）；名称交给原生 input[type=file]。
    expect(root()?.hasAttribute('role')).toBe(false);
    expect(root()?.hasAttribute('aria-label')).toBe(false);
    expect(input().getAttribute('aria-label')).toBe('文件上传');
    expect(root()?.getAttribute('data-scui-invalid')).toBe('false');
    expect(root()?.hasAttribute('data-scui-disabled')).toBe(false);
    expect(root()?.className).not.toMatch(/scui-upload--/);
  });

  it('defaultFileList 三项恒输出 data-scui-status，进度走原生 progress', () => {
    render(() => <Upload defaultFileList={seed()} />);
    expect(items()).toHaveLength(3);
    expect(items().map((node) => node.getAttribute('data-scui-status'))).toEqual([
      'done',
      'error',
      'uploading',
    ]);
    expect(root()?.getAttribute('data-scui-invalid')).toBe('true');
    const progress = itemAt(2).querySelector('progress');
    expect(progress?.getAttribute('value')).toBe('40');
    expect(progress?.getAttribute('aria-label')).toContain('上传进度');
  });

  it('disabled 同时输出原生 disabled 与 data-scui-disabled', () => {
    render(() => <Upload disabled defaultFileList={seed()} />);
    expect(root()?.getAttribute('data-scui-disabled')).toBe('');
    expect(input().hasAttribute('disabled')).toBe(true);
    expect(
      document
        .querySelector<HTMLElement>('[data-scui-role="upload-trigger"]')
        ?.hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(actionAt(0, 'upload-remove'));
    expect(items()).toHaveLength(3);
  });
});

describe('Upload：受控优先级与单一出口', () => {
  it('受控 fileList 时删除只发 onChange，DOM 不自行回弹', () => {
    const onChange = vi.fn();
    const controlled = seed();
    render(() => <Upload fileList={controlled} onChange={onChange} />);
    fireEvent.click(actionAt(0, 'upload-remove'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toHaveLength(2);
    expect(onChange.mock.calls[0]?.[1].file.uid).toBe('a');
    expect(items()).toHaveLength(3);
  });

  it('非受控删除后列表与 onChange 同步', () => {
    const onChange = vi.fn();
    render(() => <Upload defaultFileList={seed()} onChange={onChange} />);
    fireEvent.click(actionAt(0, 'upload-remove'));
    expect(items()).toHaveLength(2);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[1].file.uid).toBe('a');
  });
});

describe('Upload：customRequest 驱动上传状态机', () => {
  it('选择文件后进度 / 成功真的改写状态与 progress', () => {
    const captured: UploadRequestOptions[] = [];
    render(() => (
      <Upload
        customRequest={(options) => {
          captured.push(options);
        }}
      />
    ));
    select([makeFile()]);
    expect(items()).toHaveLength(1);
    expect(itemAt(0).getAttribute('data-scui-status')).toBe('uploading');
    expect(captured[0]?.file.name).toBe('demo.txt');
    expect(captured[0]?.signal.aborted).toBe(false);

    captured[0]?.onProgress(55);
    expect(itemAt(0).querySelector('progress')?.getAttribute('value')).toBe('55');
    captured[0]?.onProgress(180);
    expect(itemAt(0).querySelector('progress')?.getAttribute('value')).toBe('100');
    captured[0]?.onSuccess({ url: '/files/demo.txt' });
    expect(itemAt(0).getAttribute('data-scui-status')).toBe('done');
    expect(itemAt(0).querySelector('progress')).toBeNull();
  });

  it('onError 转入 error 并露出可读文案', () => {
    const captured: UploadRequestOptions[] = [];
    render(() => (
      <Upload
        customRequest={(options) => {
          captured.push(options);
        }}
      />
    ));
    select([makeFile()]);
    captured[0]?.onError(new Error('服务异常'));
    expect(itemAt(0).getAttribute('data-scui-status')).toBe('error');
    expect(actionAt(0, 'upload-error').textContent).toContain('服务异常');
    expect(actionAt(0, 'upload-retry')).not.toBeNull();
  });

  it('进度推进不重建列表行：行节点身份在整条上传链路里保持稳定', () => {
    // §30.52：进度是高频更新（Demo 里 120ms 一条），行节点一旦被重建，焦点、滚动位置、
    // CSS 过渡全丢，真实浏览器里连点击都会撞上「节点已从 DOM 移除」。这里用节点身份钉死。
    const captured: UploadRequestOptions[] = [];
    render(() => (
      <Upload
        customRequest={(options) => {
          captured.push(options);
        }}
      />
    ));
    select([makeFile()]);
    const row = itemAt(0);
    const cancelButton = actionAt(0, 'upload-cancel');
    const progress = itemAt(0).querySelector('progress');

    captured[0]?.onProgress(20);
    captured[0]?.onProgress(40);
    captured[0]?.onProgress(60);

    expect(itemAt(0)).toBe(row);
    expect(actionAt(0, 'upload-cancel')).toBe(cancelButton);
    expect(itemAt(0).querySelector('progress')).toBe(progress);
    expect(progress?.getAttribute('value')).toBe('60');
  });

  it('不传 customRequest 时不发网络请求，文件直接 done', () => {
    render(() => <Upload />);
    select([makeFile('local.txt')]);
    expect(items()).toHaveLength(1);
    expect(itemAt(0).getAttribute('data-scui-status')).toBe('done');
  });

  it('取消先 abort 再转 error，旧请求回调不再改写状态', () => {
    const captured: UploadRequestOptions[] = [];
    render(() => (
      <Upload
        customRequest={(options) => {
          captured.push(options);
        }}
      />
    ));
    select([makeFile()]);
    fireEvent.click(actionAt(0, 'upload-cancel'));
    expect(captured[0]?.signal.aborted).toBe(true);
    expect(itemAt(0).getAttribute('data-scui-status')).toBe('error');
    expect(actionAt(0, 'upload-error').textContent).toContain('已取消');
    captured[0]?.onSuccess();
    expect(itemAt(0).getAttribute('data-scui-status')).toBe('error');
  });

  it('重试重新调用 customRequest 并换新 signal', () => {
    const calls: UploadRequestOptions[] = [];
    render(() => (
      <Upload
        defaultFileList={[{ uid: 'x', name: 'retry.txt', status: 'error', error: '网络中断' }]}
        customRequest={(options) => {
          calls.push(options);
        }}
      />
    ));
    fireEvent.click(actionAt(0, 'upload-retry'));
    expect(calls).toHaveLength(1);
    expect(itemAt(0).getAttribute('data-scui-status')).toBe('uploading');
    calls[0]?.onError(new Error('再次失败'));
    fireEvent.click(actionAt(0, 'upload-retry'));
    expect(calls).toHaveLength(2);
    // onError 是「请求正常结束」而不是取消：旧 signal 不该被 abort，
    // 重试真正要保证的是换一个全新的、未 aborted 的 signal。
    expect(calls[0]?.signal.aborted).toBe(false);
    expect(calls[1]?.signal).not.toBe(calls[0]?.signal);
    expect(calls[1]?.signal.aborted).toBe(false);
  });
});

describe('Upload：上传前校验与拖拽', () => {
  it('beforeUpload 返回 false 时文件以 error 入列且不调用 customRequest', () => {
    const customRequest = vi.fn();
    render(() => <Upload beforeUpload={() => false} customRequest={customRequest} />);
    select([makeFile()]);
    expect(items()).toHaveLength(1);
    expect(itemAt(0).getAttribute('data-scui-status')).toBe('error');
    expect(customRequest).not.toHaveBeenCalled();
  });

  it('accept / maxSize / maxCount 都把被拒文件留在列表里说明原因', () => {
    render(() => <Upload accept=".pdf" maxSize={15} maxCount={2} />);
    select([makeFile('wrong.txt'), makeFile('big.pdf', 30, 'application/pdf')]);
    expect(items().map((node) => node.getAttribute('data-scui-status'))).toEqual([
      'error',
      'error',
    ]);
    expect(actionAt(0, 'upload-error').textContent).toContain('文件类型');
    expect(actionAt(1, 'upload-error').textContent).toContain('大小');
  });

  it('拖拽悬停只改 data-scui-dragging，落下后把文件送进同一入口', () => {
    render(() => <Upload />);
    // 拖放事件挂在交互元素（触发按钮）上，根节点只是状态输出；
    // Biome 的 noStaticElementInteractions 不允许在静态 div 上挂事件。
    fireEvent.dragOver(trigger());
    expect(root()?.getAttribute('data-scui-dragging')).toBe('');
    fireEvent.dragLeave(trigger());
    expect(root()?.hasAttribute('data-scui-dragging')).toBe(false);
    fireEvent.drop(trigger(), { dataTransfer: { files: [makeFile('dropped.txt')] } });
    expect(items()).toHaveLength(1);
    expect(actionAt(0, 'upload-name').textContent).toContain('dropped.txt');
    expect(root()?.hasAttribute('data-scui-dragging')).toBe(false);
  });
});

describe('Upload：Form.Item 接管 fileList', () => {
  it('删除后字段值同步，提交拿到变更后的列表', async () => {
    const onFinish = vi.fn();
    function Harness() {
      const [form] = useForm<FormValues>({ attachments: seed() });
      return (
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="attachments" label="附件">
            <Upload />
          </Form.Item>
        </Form>
      );
    }
    render(() => <Harness />);
    expect(items()).toHaveLength(3);
    // 字段控件三件套落在 labelable 的 input[type=file] 上，不是长文案的触发按钮：
    // 否则 label[for] 会把按钮的可访问名称改成「附件」，触发 axe 的
    // label-content-name-mismatch（可见文案必须包含在可访问名称里）。
    const control = document.querySelector<HTMLElement>('[data-scui-role="upload-input"]');
    expect(control?.id).toMatch(/^scui-field-/);
    expect(control?.getAttribute('aria-labelledby')).toMatch(/scui-field-/);
    expect(
      document
        .querySelector<HTMLElement>('[data-scui-role="upload-trigger"]')
        ?.hasAttribute('aria-labelledby'),
    ).toBe(false);
    fireEvent.click(actionAt(0, 'upload-remove'));
    expect(items()).toHaveLength(2);
    fireEvent.submit(document.querySelector('form')!);
    // Form 的 onFinish 在 await validateFields() 之后才发，必须等微任务落地。
    await vi.waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    const values = onFinish.mock.calls[0]?.[0] as FormValues | undefined;
    expect((values?.attachments as UploadFile[] | undefined)?.map((file) => file.uid)).toEqual([
      'b',
      'c',
    ]);
  });
});
