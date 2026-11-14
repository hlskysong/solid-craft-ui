import { createSignal } from 'solid-js';
import { Button, Drawer, type DrawerSize } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '尺寸与显式宽高',
  description:
    '三档尺寸共用同一套贴边规则；左右方向用 width、上下方向用 height 显式覆盖，数字按 px 处理。',
};

const SIZES: readonly DrawerSize[] = ['small', 'medium', 'large'];

export default function DrawerSizeDemo() {
  const [open, setOpen] = createSignal(false);
  const [customOpen, setCustomOpen] = createSignal(false);
  const [size, setSize] = createSignal<DrawerSize>('medium');

  const openWith = (next: DrawerSize) => {
    setSize(next);
    setOpen(true);
  };

  return (
    <>
      <DemoSection title="三档尺寸">
        <div class="demo-row">
          {SIZES.map((item) => (
            <Button variant="outline" onClick={() => openWith(item)}>
              打开 {item}
            </Button>
          ))}
        </div>
        <Drawer title="尺寸档位" open={open()} size={size()} onOpenChange={setOpen}>
          <p>左右方向的抽屉按 inline-size 铺开，三档分别是 280 / 378 / 520 像素。</p>
          <p>当前尺寸：{size()}</p>
        </Drawer>
      </DemoSection>

      <DemoSection title="显式尺寸">
        <Button variant="outline" onClick={() => setCustomOpen(true)}>
          打开自定义尺寸
        </Button>
        <Drawer
          title="自定义高度"
          open={customOpen()}
          placement="bottom"
          height="42vh"
          width={999}
          onOpenChange={setCustomOpen}
        >
          <p>bottom 方向只认 height：这里传的 width 不会把抽屉撑宽。</p>
        </Drawer>
      </DemoSection>
    </>
  );
}
