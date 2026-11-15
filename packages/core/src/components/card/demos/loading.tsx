import { createSignal } from 'solid-js';
import { Button, Card } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '加载态',
  description:
    'loading 为真时正文换成 T3-05 的 Skeleton，表头与封面照常占位；切换前后卡片高度不抖动。',
};

export default function CardLoadingDemo() {
  const [loading, setLoading] = createSignal(true);

  return (
    <DemoSection title="加载态">
      <div class="demo-column">
        <Button variant="outline" size="small" onClick={() => setLoading(!loading())}>
          切换加载状态
        </Button>
        <p data-testid="card-loading-log">当前状态：{loading() ? '加载中' : '已加载'}</p>
        <Card
          title="年度维简计划明细"
          extra={<span>共 12 条</span>}
          loading={loading()}
          data-testid="card-loading-target"
        >
          <div>
            <div>第一行：主通风机 2 台</div>
            <div>第二行：皮带输送机 1 套</div>
            <div>第三行：供电柜 4 面</div>
          </div>
        </Card>
      </div>
    </DemoSection>
  );
}
