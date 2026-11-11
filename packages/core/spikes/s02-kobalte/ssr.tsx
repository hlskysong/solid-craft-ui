import { renderToString } from 'solid-js/web';

import { ScuiDialog } from './Dialog';
import { ScuiSelect } from './Select';

const options = [
  { value: 'shijiazhuang', label: '石家庄' },
  { value: 'handan', label: '邯郸' },
  { value: 'tangshan', label: '唐山' },
];

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <ScuiSelect options={options} aria-label="城市" size="large" />
      <ScuiDialog trigger="打开设置" title="设置">
        预研内容
      </ScuiDialog>
    </div>
  ));
}
