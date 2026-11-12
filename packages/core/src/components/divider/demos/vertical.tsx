import { Button, Divider, Link, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '垂直分割',
  description: '在文本、链接与按钮组之间插入垂直分割线。',
};

export default function Vertical() {
  return (
    <>
      <DemoSection title="文本与链接">
        <div class="demo-inline">
          <Text>计划编号</Text>
          <Divider orientation="vertical" />
          <Text>设备清单</Text>
          <Divider orientation="vertical" />
          <Link href="#divider-vertical-anchor">审批记录</Link>
        </div>
      </DemoSection>
      <DemoSection title="按钮组与虚线">
        <div class="demo-inline">
          <Button variant="text">新增</Button>
          <Divider orientation="vertical" />
          <Button variant="text">编辑</Button>
          <Divider orientation="vertical" dashed />
          <Button variant="text">删除</Button>
        </div>
        <p id="divider-vertical-anchor">锚点目标</p>
      </DemoSection>
    </>
  );
}
