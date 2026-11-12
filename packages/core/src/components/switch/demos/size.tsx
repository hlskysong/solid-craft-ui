import { Switch } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '尺寸与禁用',
  description: 'small / medium / large 三档尺寸，以及禁用态下的开与关。',
};

export default function SwitchSizeDemo() {
  return (
    <>
      <DemoSection title="尺寸">
        <Switch size="small" defaultChecked>
          small
        </Switch>
        <Switch size="medium" defaultChecked>
          medium
        </Switch>
        <Switch size="large" defaultChecked>
          large
        </Switch>
      </DemoSection>

      <DemoSection title="禁用">
        <Switch disabled>禁用且关闭</Switch>
        <Switch disabled defaultChecked>
          禁用且开启
        </Switch>
      </DemoSection>
    </>
  );
}
