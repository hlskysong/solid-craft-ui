import { renderToString } from 'solid-js/web';

import { ScuiTable } from './Table';
import { makeRows } from './table-engine';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <ScuiTable rows={makeRows(10_000)} windowSize={20} />
    </div>
  ));
}
