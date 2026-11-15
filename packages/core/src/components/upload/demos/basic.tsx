import { createSignal } from 'solid-js';
import { Upload, type UploadChangeInfo, type UploadFile } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '点击 / 拖拽与上传前校验',
  description:
    '原生 input[type=file] 与 HTML5 拖拽共用同一个入口；accept / maxSize / maxCount / beforeUpload 的拒绝结果以 error 状态留在列表里说明原因，不静默丢弃。受控 fileList 演示「只发事件、DOM 不回弹」。',
};

// 静态初始数据：视觉基线截的是这一帧，不依赖网络与定时器。
const initial: UploadFile[] = [
  { uid: 'basic-1', name: '设备清单.pdf', size: 24576, status: 'done', percent: 100 },
  { uid: 'basic-2', name: '采购依据.docx', size: 12288, status: 'done', percent: 100 },
];
const locked: UploadFile[] = [
  { uid: 'locked-1', name: '受控文件.pdf', size: 4096, status: 'done', percent: 100 },
];

export default function UploadBasicDemo() {
  const [count, setCount] = createSignal(initial.length);
  const [log, setLog] = createSignal('尚未操作');

  return (
    <DemoSection title="基础用法">
      <div class="demo-column">
        <Upload
          accept=".pdf,.docx"
          maxSize={2 * 1024 * 1024}
          defaultFileList={initial}
          aria-label="采购附件上传"
          data-testid="upload-basic"
          onChange={(fileList: UploadFile[], info: UploadChangeInfo) => {
            setCount(fileList.length);
            setLog(`${info.file.name}：${info.file.status}`);
          }}
        >
          点击选择，或拖拽 PDF / DOCX 到此处
        </Upload>
        <p data-testid="upload-basic-count">当前 {count()} 个文件</p>
        <p data-testid="upload-basic-log">{log()}</p>
        <h3>受控 fileList：点击删除只发事件，列表不自行回弹</h3>
        <Upload
          fileList={locked}
          aria-label="受控上传"
          data-testid="upload-controlled"
          onChange={(fileList: UploadFile[]) => setLog(`受控收到 ${fileList.length} 项`)}
        />
      </div>
    </DemoSection>
  );
}
