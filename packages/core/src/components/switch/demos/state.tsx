import { createSignal } from 'solid-js';
import { Switch } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '受控状态',
  description: '用 createSignal 控制开关状态，onChange 回显，并演示校验态。',
};

export default function SwitchStateDemo() {
  const [enabled, setEnabled] = createSignal(true);
  const [strict, setStrict] = createSignal(false);

  return (
    <>
      <DemoSection title="受控开关">
        <Switch checked={enabled()} onChange={(checked) => setEnabled(checked)}>
          启用通知
        </Switch>
        <span>
          当前状态：<output>{enabled() ? '已开启' : '已关闭'}</output>
        </span>
      </DemoSection>

      <DemoSection title="校验态">
        <Switch checked={strict()} status="error" onChange={(checked) => setStrict(checked)}>
          严格模式
        </Switch>
        <span>
          当前状态：<output>{strict() ? '已开启' : '已关闭'}</output>
        </span>
      </DemoSection>
    </>
  );
}
