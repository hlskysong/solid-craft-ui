import { Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '超长文本',
  description: '窄容器下的单行省略与换行，以及 ellipsis 与普通文本的对比。',
};

const LONG = '冀中能源集团设备维检计划管理平台设备名称与型号采购数量本次采购单价合计金额';

export default function Ellipsis() {
  return (
    <>
      <DemoSection title="单行省略（容器 240px）">
        <div class="demo-stack" style={{ 'max-width': '240px' }}>
          <Text ellipsis>{LONG}</Text>
          <Text ellipsis tone="secondary">
            {`${LONG}（含运费与安装调试费用）`}
          </Text>
        </div>
      </DemoSection>
      <DemoSection title="不省略会换行">
        <div class="demo-stack" style={{ 'max-width': '240px' }}>
          <Text>{LONG}</Text>
        </div>
      </DemoSection>
    </>
  );
}
