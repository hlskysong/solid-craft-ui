import { Tag, type TagColor } from 'solid-craft';

import { COLORS, DemoSection } from '../../demos/shared';

export const demo = {
  title: '边框开关',
  description:
    'data-scui-bordered 存在即真。边框恒占 1px，关闭时只是透明色，因此开关前后标签高度不变、不抖动。',
};

const LABELS: Record<TagColor, string> = {
  primary: '进行中',
  neutral: '草稿',
  success: '已通过',
  warning: '待复核',
  danger: '已驳回',
};

export default function TagBorderedDemo() {
  return (
    <DemoSection title="边框开关">
      <div class="demo-column">
        <div class="demo-row" data-testid="tag-bordered-on">
          {COLORS.map((color) => (
            <Tag color={color} bordered data-testid={`tag-on-${color}`}>
              {LABELS[color]}
            </Tag>
          ))}
        </div>
        <div class="demo-row" data-testid="tag-bordered-off">
          {COLORS.map((color) => (
            <Tag color={color} data-testid={`tag-off-${color}`}>
              {LABELS[color]}
            </Tag>
          ))}
        </div>
      </div>
    </DemoSection>
  );
}
