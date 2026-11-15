import { createSignal, onCleanup } from 'solid-js';
import { Upload, type UploadFile, type UploadRequestOptions } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: 'customRequest 进度 / 取消 / 重试',
  description:
    '组件不内置任何传输实现：customRequest 拿到 onProgress / onSuccess / onError 与 AbortSignal，删除或取消时 abort 并清掉定时器。列表初始态直接给出 uploading / done / error 三态静态骨架。',
};

// 三态静态初始数据：让基线一帧覆盖进度条、完成态与错误态。
const initial: UploadFile[] = [
  {
    uid: 'progress-1',
    name: '主通风机参数表.pdf',
    size: 20480,
    status: 'uploading',
    percent: 45,
  },
  { uid: 'progress-2', name: '年度计划汇总.pdf', size: 51200, status: 'done', percent: 100 },
  {
    uid: 'progress-3',
    name: '审批附件.pdf',
    size: 8192,
    status: 'error',
    error: '网络中断，可重试',
  },
];

export default function UploadProgressDemo() {
  const [failNext, setFailNext] = createSignal(false);
  const [log, setLog] = createSignal('等待上传');
  const timers = new Set<ReturnType<typeof setInterval>>();

  onCleanup(() => {
    for (const timer of timers) clearInterval(timer);
    timers.clear();
  });

  // 模拟传输：120ms 推进 20%，到 100 后按开关决定成功 / 失败；abort 立即清定时器。
  const customRequest = (options: UploadRequestOptions): void => {
    const shouldFail = failNext();
    let percent = 0;
    setLog(`开始上传 ${options.file.name}`);
    const timer = setInterval(() => {
      if (options.signal.aborted) {
        clearInterval(timer);
        timers.delete(timer);
        return;
      }
      percent += 20;
      options.onProgress(percent);
      if (percent >= 100) {
        clearInterval(timer);
        timers.delete(timer);
        if (shouldFail) {
          setLog(`${options.file.name} 模拟失败`);
          options.onError(new Error('模拟服务端失败'));
        } else {
          setLog(`${options.file.name} 上传完成`);
          options.onSuccess({ url: '/uploads/demo' });
        }
      }
    }, 120);
    timers.add(timer);
    options.signal.addEventListener(
      'abort',
      () => {
        clearInterval(timer);
        timers.delete(timer);
      },
      { once: true },
    );
  };

  return (
    <DemoSection title="进度与失败重试">
      <div class="demo-column">
        <p>打开「模拟失败」后选一个文件，失败后点「重试」即可重跑同一条链路。</p>
        <label>
          <input
            type="checkbox"
            data-testid="upload-fail-toggle"
            checked={failNext()}
            onChange={(event) => setFailNext(event.currentTarget.checked)}
          />
          下一次上传模拟失败
        </label>
        <Upload
          defaultFileList={initial}
          customRequest={customRequest}
          aria-label="进度演示上传"
          data-testid="upload-progress"
        >
          选择文件开始模拟上传
        </Upload>
        <p data-testid="upload-progress-log">{log()}</p>
      </div>
    </DemoSection>
  );
}
