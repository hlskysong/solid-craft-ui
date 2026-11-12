import { Button, message } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '脱离组件树调用静态 message，五种语义各用一个按钮触发。',
};

export default function AppBasicDemo() {
  return (
    <>
      <DemoSection title="静态短提示">
        <Button
          onClick={() => {
            message.info('普通提示');
          }}
        >
          普通提示
        </Button>
        <Button
          onClick={() => {
            message.success('操作成功');
          }}
        >
          成功提示
        </Button>
        <Button
          onClick={() => {
            message.warning('请注意风险');
          }}
        >
          警告提示
        </Button>
      </DemoSection>
      <DemoSection title="异常与加载">
        <Button
          onClick={() => {
            message.error('操作失败');
          }}
        >
          错误提示
        </Button>
        <Button
          onClick={() => {
            message.loading('加载中');
          }}
        >
          加载提示
        </Button>
      </DemoSection>
    </>
  );
}
