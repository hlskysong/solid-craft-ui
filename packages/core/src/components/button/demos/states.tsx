import { createSignal } from 'solid-js';
import { Button } from 'solid-craft';
import { DotIcon } from '../../demos/shared';

export const demo = {
  title: '状态与图标',
  description: '加载 / 禁用时禁止点击；loading 同时输出 aria-busy；图标支持首尾位置。',
};

export default function States() {
  const [loading, setLoading] = createSignal(false);
  return (
    <div class="demo-stack">
      <div class="demo-row">
        <Button disabled>禁用</Button>
        <Button loading>加载中</Button>
        <Button icon={<DotIcon />}>前置图标</Button>
        <Button icon={<DotIcon />} iconPosition="end">
          后置图标
        </Button>
      </div>
      <div class="demo-row">
        <Button loading={loading()} onClick={() => setLoading((value) => !value)}>
          {loading() ? '点击结束加载' : '点击进入加载态'}
        </Button>
      </div>
    </div>
  );
}
