import { createSignal } from 'solid-js';
import { Button, Drawer, type DrawerPlacement } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '打开态与方向切换',
  description:
    '首屏即打开，用于视觉基线与弹层态 axe 扫描；弹层内可切换四个贴边方向，关闭后可用背景按钮重新打开。',
};

const SIDES: readonly DrawerPlacement[] = ['left', 'right', 'top', 'bottom'];

export default function DrawerOpenStateDemo() {
  const [open, setOpen] = createSignal(true);
  const [side, setSide] = createSignal<DrawerPlacement>('right');

  return (
    <>
      <DemoSection title="首屏打开">
        <Button variant="outline" onClick={() => setOpen(true)}>
          重新打开
        </Button>
        <Drawer
          title="打开态视觉基线"
          open={open()}
          placement={side()}
          onOpenChange={setOpen}
          footer={
            <Button variant="outline" color="neutral" onClick={() => setOpen(false)}>
              收起抽屉
            </Button>
          }
        >
          <p>遮罩、贴边容器、标题、正文与底部操作区在这一页同时参与基线截图。</p>
          <div class="demo-row">
            {SIDES.map((item) => (
              <Button variant="outline" color="neutral" onClick={() => setSide(item)}>
                {item}
              </Button>
            ))}
          </div>
          <p>当前方向：{side()}</p>
        </Drawer>
      </DemoSection>
    </>
  );
}
