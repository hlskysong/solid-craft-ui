/**
 * T3-13 SSR 入口：Upload 静态骨架。
 *
 * 与 T3-11 / T3-12 同口径：只断言正面的静态输出。文件列表全部来自
 * `defaultFileList` 纯数据，不 import 交互 Demo，不碰 File / DataTransfer /
 * AbortController（这些只存在于客户端事件链）。第二个实例覆盖禁用 + 空列表，
 * 让 `data-scui-invalid="false"` 与 `data-scui-disabled` 都进入服务端实证。
 */
import { renderToString } from 'solid-js/web';

import { Upload } from '../Upload';
import type { UploadFile } from '../types';

const files: UploadFile[] = [
  { uid: 'ssr-1', name: '设备清单.pdf', size: 24576, status: 'uploading', percent: 45 },
  { uid: 'ssr-2', name: '采购依据.pdf', size: 12288, status: 'done', percent: 100 },
  {
    uid: 'ssr-3',
    name: '审批附件.pdf',
    size: 8192,
    status: 'error',
    error: '网络中断，可重试',
  },
];

const disabledFiles: UploadFile[] = [
  { uid: 'ssr-4', name: '只读附件.pdf', size: 4096, status: 'done', percent: 100 },
];

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-testid="upload-ssr-page">
      <Upload defaultFileList={files} aria-label="采购附件上传" data-testid="upload-ssr-main" />
      <Upload
        defaultFileList={disabledFiles}
        disabled
        aria-label="禁用上传"
        data-testid="upload-ssr-disabled"
      />
    </div>
  ));
}
