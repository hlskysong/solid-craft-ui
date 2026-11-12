import { Checkbox } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '默认、选中与半选三态，三档尺寸、禁用态与校验态。',
};

export default function CheckboxBasicDemo() {
  return (
    <>
      <DemoSection title="三态">
        <Checkbox>默认未选中</Checkbox>
        <Checkbox defaultChecked>选中</Checkbox>
        <Checkbox indeterminate>半选</Checkbox>
      </DemoSection>

      <DemoSection title="尺寸">
        <Checkbox size="small">small</Checkbox>
        <Checkbox size="medium">medium</Checkbox>
        <Checkbox size="large">large</Checkbox>
      </DemoSection>

      <DemoSection title="禁用">
        <Checkbox disabled>禁用未选中</Checkbox>
        <Checkbox disabled defaultChecked>
          禁用已选中
        </Checkbox>
      </DemoSection>

      <DemoSection title="校验态">
        <Checkbox status="error">必须勾选才能继续</Checkbox>
        <Checkbox status="error" defaultChecked>
          已勾选但仍有错误
        </Checkbox>
      </DemoSection>
    </>
  );
}
