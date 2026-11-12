import { createSignal } from 'solid-js';
import { Checkbox, CheckboxGroup } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '受控状态',
  description: '用 createSignal 持有选中值，onChange 回显当前状态，并支持垂直排列。',
};

const HOBBY_OPTIONS = [
  { label: '阅读', value: 'reading' },
  { label: '音乐', value: 'music' },
  { label: '运动', value: 'sports' },
];

export default function CheckboxStateDemo() {
  const [agreed, setAgreed] = createSignal(false);
  const [hobbies, setHobbies] = createSignal<string[]>(['reading']);

  return (
    <>
      <DemoSection title="受控值">
        <Checkbox checked={agreed()} onChange={(checked) => setAgreed(checked)}>
          我已阅读并同意用户协议
        </Checkbox>
        <span>
          当前状态：<output>{agreed() ? '已同意' : '未同意'}</output>
        </span>
      </DemoSection>

      <DemoSection title="垂直排列">
        <CheckboxGroup
          aria-label="兴趣爱好"
          orientation="vertical"
          options={HOBBY_OPTIONS}
          value={hobbies()}
          onChange={(values) => setHobbies(values)}
        />
        <span>
          已选：<output>{hobbies().length > 0 ? hobbies().join('、') : '（无）'}</output>
        </span>
      </DemoSection>
    </>
  );
}
