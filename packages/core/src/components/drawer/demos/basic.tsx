import { createSignal } from 'solid-js';
import { Button, Drawer, type DrawerPlacement } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法与四方向',
  description:
    '外部按钮受控打开；left / right / top / bottom 四个方向共用同一套浮层行为，切换方向只改贴边定位与尺寸轴。',
};

const SIDES: readonly DrawerPlacement[] = ['left', 'right', 'top', 'bottom'];

export default function DrawerBasicDemo() {
  const [open, setOpen] = createSignal(false);
  const [side, setSide] = createSignal<DrawerPlacement>('right');

  const openWith = (next: DrawerPlacement) => {
    setSide(next);
    setOpen(true);
  };

  return (
    <>
      <DemoSection title="四方向">
        <div class="demo-row">
          {SIDES.map((item) => (
            <Button variant="outline" onClick={() => openWith(item)}>
              打开 {item}
            </Button>
          ))}
        </div>
        <Drawer
          title="设备采购计划明细"
          open={open()}
          placement={side()}
          onOpenChange={setOpen}
          footer={
            <Button variant="outline" color="neutral" onClick={() => setOpen(false)}>
              关闭抽屉
            </Button>
          }
        >
          <p>按年度维简计划填写本次采购数量与本次采购单价，提交后进入审批流。</p>
          <p>当前方向：{side()}</p>
        </Drawer>
      </DemoSection>

      <DemoSection title="关闭路径">
        <p>右上角关闭按钮、ESC、点击遮罩三条路径都走同一个 onOpenChange 出口。</p>
      </DemoSection>
    </>
  );
}
