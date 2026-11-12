import { Radio, RadioGroup } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '单选框组',
  description: '选项数组与手写子项两种写法，并支持垂直排列。',
};

const PLAN_OPTIONS = [
  { label: '基础版', value: 'basic' },
  { label: '专业版', value: 'pro' },
  { label: '旗舰版', value: 'ultimate', disabled: true },
];

export default function RadioGroupDemo() {
  return (
    <>
      <DemoSection title="options 写法">
        <RadioGroup aria-label="订阅方案" options={PLAN_OPTIONS} defaultValue="basic" />
      </DemoSection>

      <DemoSection title="手写子项">
        <RadioGroup aria-label="付款方式" defaultValue="card">
          <Radio value="card">银行卡</Radio>
          <Radio value="alipay">支付宝</Radio>
          <Radio value="wechat">微信支付</Radio>
        </RadioGroup>
      </DemoSection>

      <DemoSection title="垂直排列">
        <RadioGroup aria-label="配送时间" orientation="vertical" defaultValue="morning">
          <Radio value="morning">上午 9:00 - 12:00</Radio>
          <Radio value="afternoon">下午 14:00 - 18:00</Radio>
          <Radio value="evening">晚上 19:00 - 21:00</Radio>
        </RadioGroup>
      </DemoSection>
    </>
  );
}
