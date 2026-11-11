import { createSignal } from 'solid-js';
import { Input } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '单行输入',
  description: '三档尺寸、禁用态、前后缀图标、允许清除、密码显隐与回车搜索。',
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" />
      <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
      <path
        d="M3 13c0-2.2 2.2-4 5-4s5 1.8 5 4"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5" />
      <path d="M2.5 4.5L8 8.5l5.5-4" stroke="currentColor" stroke-width="1.5" />
    </svg>
  );
}

export default function Basic() {
  const [searched, setSearched] = createSignal('（尚未搜索）');
  const [cleared, setCleared] = createSignal(0);

  return (
    <>
      <DemoSection title="尺寸">
        <Input size="small" aria-label="small 尺寸" placeholder="small 尺寸" />
        <Input size="medium" aria-label="medium 尺寸" placeholder="medium 尺寸（默认）" />
        <Input size="large" aria-label="large 尺寸" placeholder="large 尺寸" />
      </DemoSection>

      <DemoSection title="禁用">
        <Input disabled aria-label="禁用态输入" placeholder="禁用占位文案" />
        <Input disabled aria-label="已填写但不可编辑" defaultValue="已填写但不可编辑" allowClear />
      </DemoSection>

      <DemoSection title="前后缀图标">
        <Input prefix={<UserIcon />} aria-label="用户名" placeholder="用户名" />
        <Input suffix={<MailIcon />} aria-label="邮箱地址" placeholder="邮箱地址" />
        <Input prefix={<SearchIcon />} suffix=".com" aria-label="站点域名" placeholder="站点域名" />
      </DemoSection>

      <DemoSection title="允许清除">
        <Input
          aria-label="可清除的输入"
          allowClear
          defaultValue="点右侧按钮可清空"
          onClear={() => setCleared((count) => count + 1)}
        />
        <span>
          已清除 <output>{cleared()}</output> 次
        </span>
      </DemoSection>

      <DemoSection title="密码显隐">
        <Input
          type="password"
          aria-label="密码"
          defaultValue="scui-secret"
          placeholder="请输入密码"
        />
        <Input
          type="password"
          visibilityToggle={false}
          aria-label="不可切换的密码"
          defaultValue="不可切换"
        />
      </DemoSection>

      <DemoSection title="回车搜索">
        <Input
          type="search"
          aria-label="关键词"
          placeholder="输入关键词后回车"
          onSearch={(value) => setSearched(value === '' ? '（空关键词）' : value)}
        />
        <Input
          type="search"
          enterButton
          aria-label="带搜索按钮的关键词"
          placeholder="带搜索按钮"
          onSearch={(value) => setSearched(value === '' ? '（空关键词）' : value)}
        />
        <span>
          最近一次搜索：<output>{searched()}</output>
        </span>
      </DemoSection>
    </>
  );
}
