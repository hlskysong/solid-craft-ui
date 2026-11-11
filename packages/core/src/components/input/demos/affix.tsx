import { createSignal } from 'solid-js';
import { Input } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '前缀与后缀',
  description: '用前缀拼协议、用后缀挂单位与字数提示，并演示 createSignal 驱动的受控写法。',
};

export default function Affix() {
  const [site, setSite] = createSignal('docs');
  const [amount, setAmount] = createSignal('128');
  const [title, setTitle] = createSignal('可编辑的标题');

  const titleLimit = 20;

  return (
    <>
      <DemoSection title="协议前缀">
        <Input
          prefix="https://"
          aria-label="站点名"
          value={site()}
          onChange={(value) => setSite(value)}
          placeholder="example"
          suffix=".cn"
        />
        <span>
          访问地址：<output>https://{site() || '（空）'}.cn</output>
        </span>
      </DemoSection>

      <DemoSection title="单位后缀">
        <Input
          suffix="元"
          aria-label="金额"
          value={amount()}
          onChange={(value) => setAmount(value.replace(/[^0-9]/g, ''))}
          placeholder="请输入金额"
        />
        <Input defaultValue="30" suffix="天" aria-label="天数" placeholder="请输入天数" />
        <Input defaultValue="80" suffix="%" aria-label="百分比" placeholder="请输入百分比" />
      </DemoSection>

      <DemoSection title="字数提示后缀">
        <Input
          aria-label="标题"
          value={title()}
          onChange={(value) => setTitle(value.slice(0, titleLimit))}
          maxLength={titleLimit}
          suffix={
            <span>
              {title().length}/{titleLimit}
            </span>
          }
          placeholder="请输入标题"
        />
      </DemoSection>

      <DemoSection title="组合用法">
        <Input
          prefix="¥"
          suffix="/ 月"
          aria-label="订阅价格"
          defaultValue="99"
          placeholder="订阅价格"
          allowClear
        />
      </DemoSection>
    </>
  );
}
