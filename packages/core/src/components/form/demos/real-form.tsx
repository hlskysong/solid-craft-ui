import { createSignal } from 'solid-js';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Form,
  Input,
  InputNumber,
  RadioGroup,
  Select,
  Switch,
  Textarea,
  useForm,
  type FormValues,
} from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '真实表单页（新增 / 编辑）',
  description:
    '八字段覆盖 Input / Textarea / InputNumber / Checkbox / Radio / Switch / Select 七类控件，共用一条 useForm 实例；可载入既有记录编辑、切回新增、提交校验并回显全量快照。',
};

const CITY_OPTIONS = [
  { value: 'sjz', label: '石家庄' },
  { value: 'hd', label: '邯郸' },
  { value: 'xt', label: '邢台' },
];

const SKILL_OPTIONS = [
  { value: 'solid', label: 'SolidJS' },
  { value: 'a11y', label: '无障碍' },
  { value: 'docs', label: '文档' },
];

const LEVEL_OPTIONS = [
  { value: 'junior', label: '初级' },
  { value: 'senior', label: '高级' },
  { value: 'lead', label: '负责人' },
];

/** 新增模式的空白底稿：既是 useForm 初值，也是 resetFields 的回落目标。 */
const EMPTY_VALUES: FormValues = {
  name: '',
  city: '',
  age: null,
  bio: '',
  skills: [],
  level: '',
  enabled: false,
  agree: false,
};

/** 编辑模式的既有记录：由 setFieldsValue 一次灌进同一条实例。 */
const EDIT_VALUES: FormValues = {
  name: '张三',
  city: 'hd',
  age: 32,
  bio: '负责设备维检计划的前端开发。',
  skills: ['solid', 'a11y'],
  level: 'senior',
  enabled: true,
  agree: true,
};

export default function RealFormDemo() {
  // T2-09 的核心：Demo 与字段值都用一条实例，控件不各自持有 value / onChange，
  // 全部由 <Form.Item> 的 FieldProvider 接管（T2-03~T2-07 一行未改）。
  const [form] = useForm<FormValues>(EMPTY_VALUES);
  const [mode, setMode] = createSignal<'create' | 'edit'>('create');
  const [result, setResult] = createSignal('尚未提交');

  const loadEdit = () => {
    form.setFieldsValue(EDIT_VALUES);
    setMode('edit');
    setResult('尚未提交');
  };

  const backToCreate = () => {
    form.resetFields();
    setMode('create');
    setResult('尚未提交');
  };

  return (
    <DemoSection title="员工档案：新增与编辑">
      <div class="demo-row" data-testid="real-form-toolbar">
        <Button variant="outline" color="neutral" data-testid="real-form-edit" onClick={loadEdit}>
          载入编辑数据
        </Button>
        <Button
          variant="outline"
          color="neutral"
          data-testid="real-form-create"
          onClick={backToCreate}
        >
          切回新增
        </Button>
        <span>
          当前模式：
          <output data-testid="real-form-mode">{mode() === 'edit' ? '编辑' : '新增'}</output>
        </span>
      </div>

      <Form
        form={form}
        aria-label="员工档案"
        onFinish={(values) => setResult(`通过 ${JSON.stringify(values)}`)}
        onFinishFailed={(errors) => setResult(`失败 ${JSON.stringify(errors)}`)}
      >
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input placeholder="请输入姓名" data-testid="real-form-name" />
        </Form.Item>
        <Form.Item
          name="city"
          label="工作城市"
          rules={[{ required: true, message: '请选择工作城市' }]}
        >
          <Select options={CITY_OPTIONS} searchable clearable placeholder="请选择城市" />
        </Form.Item>
        <Form.Item name="age" label="年龄" rules={[{ min: 18, message: '年龄不得低于 18 岁' }]}>
          <InputNumber min={18} max={65} step={1} />
        </Form.Item>
        <Form.Item name="bio" label="简介">
          <Textarea autoSize showCount maxLength={120} placeholder="请填写简介" />
        </Form.Item>
        <Form.Item
          name="skills"
          label="技能标签"
          rules={[{ required: true, message: '请至少选择一项技能' }]}
        >
          <CheckboxGroup options={SKILL_OPTIONS} />
        </Form.Item>
        <Form.Item name="level" label="职级">
          <RadioGroup options={LEVEL_OPTIONS} />
        </Form.Item>
        <Form.Item name="enabled" label="启用账号">
          <Switch />
        </Form.Item>
        <Form.Item
          name="agree"
          label="同意条款"
          rules={[{ validator: (value) => (value === true ? undefined : '请先同意条款') }]}
        >
          <Checkbox>我已阅读并同意</Checkbox>
        </Form.Item>
        <Button htmlType="submit" data-testid="real-form-submit">
          提交
        </Button>
      </Form>

      <span>
        提交结果：<output data-testid="real-form-result">{result()}</output>
      </span>
    </DemoSection>
  );
}
