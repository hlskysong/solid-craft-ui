import { createSignal } from 'solid-js';
import { Button, Tooltip, type TooltipPlacement } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法与定位',
  description:
    '十二向 placement 由 Floating UI 负责翻转；切换方向只改 data-scui-anchor，浮层行为与焦点契约保持同一套。',
};

const SIDES: readonly TooltipPlacement[] = [
  'top',
  'top-start',
  'bottom',
  'bottom-end',
  'left',
  'right',
];

export default function TooltipBasicDemo() {
  const [placement, setPlacement] = createSignal<TooltipPlacement>('top');

  return (
    <>
      <DemoSection title="六向定位">
        <div class="demo-row">
          {SIDES.map((item) => (
            <Button variant="outline" color="neutral" onClick={() => setPlacement(item)}>
              {item}
            </Button>
          ))}
        </div>
        <p>当前方向：{placement()}</p>
      </DemoSection>

      <DemoSection title="提示内容">
        <Tooltip content={`按 ${placement()} 方向显示的一段说明文案`} placement={placement()}>
          <span>悬停或聚焦这里</span>
        </Tooltip>
      </DemoSection>
    </>
  );
}
