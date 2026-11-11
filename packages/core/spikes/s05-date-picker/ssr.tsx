import { renderToString } from 'solid-js/web';

import { ScuiDatePicker } from './DatePicker';

export async function render(): Promise<string> {
  return renderToString(() => (
    <div>
      <ScuiDatePicker value="2026-11-10" disabledDate={(date) => date.day === 13} />
    </div>
  ));
}
