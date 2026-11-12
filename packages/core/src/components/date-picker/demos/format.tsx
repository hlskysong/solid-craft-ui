import { DatePicker } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '格式与尺寸',
  description: 'format 的 token 子集、三档尺寸与清除按钮。',
};

export default function Format() {
  return (
    <>
      <DemoSection title="自定义格式">
        <DatePicker format="YYYY年M月D日" defaultValue="2026-03-15" aria-label="中文格式" />
        <DatePicker format="MM/DD" defaultValue="2026-03-15" aria-label="短格式" />
      </DemoSection>
      <DemoSection title="尺寸">
        <DatePicker size="small" defaultValue="2026-03-15" aria-label="小尺寸" />
        <DatePicker size="medium" defaultValue="2026-03-15" aria-label="中尺寸" />
        <DatePicker size="large" defaultValue="2026-03-15" aria-label="大尺寸" />
      </DemoSection>
      <DemoSection title="可清除">
        <DatePicker allowClear defaultValue="2026-03-15" aria-label="可清除" />
        <DatePicker allowClear placeholder="请选择日期" aria-label="空值可清除" />
      </DemoSection>
    </>
  );
}
