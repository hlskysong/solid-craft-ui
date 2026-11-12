import { createSignal } from 'solid-js';
import { Button, Select } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

const cities = [
  { value: 'sjz', label: '石家庄' },
  { value: 'hd', label: '邯郸' },
  { value: 'ts', label: '唐山' },
];

export const demo = {
  title: '状态与边界',
  description: '空选项、加载中、校验失败与禁用四种边界状态。',
};

export default function StatesDemo() {
  const [loading, setLoading] = createSignal(false);

  return (
    <>
      <DemoSection title="空态与加载">
        <Select
          options={[]}
          placeholder="没有可选项"
          emptyText="暂无城市数据"
          aria-label="空选项选择器"
        />
        <Select
          options={cities}
          loading={loading()}
          loadingText="正在加载城市列表"
          placeholder="加载中的选择器"
          aria-label="加载态选择器"
        />
        <Button onClick={() => setLoading((value) => !value)}>
          {loading() ? '结束加载' : '进入加载态'}
        </Button>
      </DemoSection>

      <DemoSection title="校验与禁用">
        <Select
          options={cities}
          status="error"
          placeholder="必填项未选择"
          aria-label="校验失败的选择器"
        />
        <Select options={cities} disabled defaultValue="sjz" aria-label="禁用的选择器" />
      </DemoSection>
    </>
  );
}
