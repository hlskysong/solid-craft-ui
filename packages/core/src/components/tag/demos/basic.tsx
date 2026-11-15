import { Tag, type TagColor } from 'solid-craft';

import { COLORS, DemoSection } from '../../demos/shared';

export const demo = {
  title: '五档配色',
  description:
    'data-scui-color 恒输出，取值与 Button 完全同口径；文本恒用深色，配色只影响浅色背景与边框，避免高饱和色铺满整个标签。',
};

const LABELS: Record<TagColor, string> = {
  primary: '进行中',
  neutral: '草稿',
  success: '已通过',
  warning: '待复核',
  danger: '已驳回',
};

export default function TagBasicDemo() {
  return (
    <DemoSection title="基础用法">
      <div class="demo-row">
        {COLORS.map((color) => (
          <Tag color={color}>{LABELS[color]}</Tag>
        ))}
      </div>
    </DemoSection>
  );
}
