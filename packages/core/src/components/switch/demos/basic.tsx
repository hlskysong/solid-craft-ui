import { Switch } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '开与关两种状态，可带文案；无文案时必须提供 aria-label。',
};

export default function SwitchBasicDemo() {
  return (
    <>
      <DemoSection title="开关状态">
        <Switch defaultChecked>已开启</Switch>
        <Switch>已关闭</Switch>
      </DemoSection>

      <DemoSection title="带文案">
        <Switch defaultChecked>接收系统通知</Switch>
        <Switch>自动更新</Switch>
      </DemoSection>

      <DemoSection title="无文案">
        <Switch aria-label="无文案开关（开）" defaultChecked />
        <Switch aria-label="无文案开关（关）" />
      </DemoSection>
    </>
  );
}
