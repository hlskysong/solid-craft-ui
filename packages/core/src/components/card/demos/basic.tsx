import { Button, Card } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '标题与操作区',
  description:
    '表头由 title 与 extra 两块组成，任一块不传就整块缺席；操作区可放任意节点，这里用 Button。',
};

export default function CardBasicDemo() {
  return (
    <DemoSection title="基础用法">
      <div class="demo-column">
        <Card
          title="维简设备采购计划"
          extra={
            <Button variant="outline" size="small">
              编辑
            </Button>
          }
        >
          本次采购数量按年度维简计划填写，提交后进入审批流。
        </Card>
        <Card title="无操作区的卡片">表头只剩标题，右侧不会留下空盒子。</Card>
        <Card>既不传标题也不传操作区时，表头整块不渲染，正文直接贴着卡片内边距。</Card>
      </div>
    </DemoSection>
  );
}
