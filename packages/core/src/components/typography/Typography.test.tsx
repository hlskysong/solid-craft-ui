import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { Link, Text, Title } from './Typography';

afterEach(cleanup);

describe('Typography', () => {
  it('renders Text with text type and medium size by default', () => {
    render(() => <Text>正文内容</Text>);

    const text = screen.getByText('正文内容');
    expect(text).toHaveAttribute('data-type', 'text');
    expect(text).toHaveAttribute('data-size', 'medium');
    expect(text.tagName).toBe('SPAN');
  });

  it('renders Title level 3 as an h3 heading', () => {
    render(() => <Title level={3}>三级标题</Title>);

    const title = screen.getByRole('heading', { level: 3, name: '三级标题' });
    expect(title).toHaveAttribute('data-type', 'title');
    expect(title).toHaveAttribute('data-level', '3');
  });

  it('renders Link with href and makes it focusable', () => {
    render(() => <Link href="/docs">文档</Link>);

    const link = screen.getByRole('link', { name: '文档' });
    expect(link).toHaveAttribute('href', '/docs');
    link.focus();
    expect(link).toHaveFocus();
  });

  it('reflects formatting props through data attributes', () => {
    render(() => (
      <Text bold ellipsis code mark delete underline>
        格式化文本
      </Text>
    ));

    const text = screen.getByText('格式化文本');
    expect(text).toHaveAttribute('data-bold', 'true');
    expect(text).toHaveAttribute('data-ellipsis', 'true');
    expect(text).toHaveAttribute('data-code', 'true');
    expect(text).toHaveAttribute('data-mark', 'true');
    expect(text).toHaveAttribute('data-delete', 'true');
    expect(text).toHaveAttribute('data-underline', 'true');
  });

  it('adds a safe rel when Link opens a new tab', () => {
    render(() => (
      <Link href="https://example.com" target="_blank">
        外部链接
      </Link>
    ));

    const link = screen.getByRole('link', { name: '外部链接' });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
