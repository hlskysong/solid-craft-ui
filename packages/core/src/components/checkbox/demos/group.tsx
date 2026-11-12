import { createMemo, createSignal } from 'solid-js';
import { Checkbox, CheckboxGroup } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '多选框组',
  description: '选项数组、手写子项与全选联动，整组值与勾选状态保持同步。',
};

const FRUIT_OPTIONS = [
  { label: '苹果', value: 'apple' },
  { label: '香蕉', value: 'banana' },
  { label: '橙子', value: 'orange' },
];

export default function CheckboxGroupDemo() {
  const [selected, setSelected] = createSignal<string[]>(['apple']);
  const allSelected = createMemo(() => selected().length === FRUIT_OPTIONS.length);
  const partial = createMemo(() => selected().length > 0 && !allSelected());

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? FRUIT_OPTIONS.map((option) => option.value) : []);
  };

  return (
    <>
      <DemoSection title="options 写法">
        <CheckboxGroup aria-label="喜欢的水果" options={FRUIT_OPTIONS} defaultValue={['banana']} />
      </DemoSection>

      <DemoSection title="手写子项">
        <CheckboxGroup aria-label="去过的城市" defaultValue={['beijing']}>
          <Checkbox value="beijing">北京</Checkbox>
          <Checkbox value="shanghai">上海</Checkbox>
          <Checkbox value="shenzhen">深圳</Checkbox>
        </CheckboxGroup>
      </DemoSection>

      <DemoSection title="全选联动">
        <Checkbox checked={allSelected()} indeterminate={partial()} onChange={toggleAll}>
          全选
        </Checkbox>
        <CheckboxGroup
          aria-label="喜欢的水果（全选联动）"
          options={FRUIT_OPTIONS}
          value={selected()}
          onChange={(values) => setSelected(values)}
        />
        <span>
          已选：<output>{selected().length > 0 ? selected().join('、') : '（无）'}</output>
        </span>
      </DemoSection>
    </>
  );
}
