import { cleanup, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from './ConfigProvider';
import { useConfig } from './context';
import type { ThemeName } from './types';

afterEach(cleanup);

function OutsideConsumer() {
  useConfig();
  return null;
}

function Probe() {
  const config = useConfig();

  return (
    <div data-testid="probe">
      <span data-testid="locale">{config.locale()}</span>
      <span data-testid="theme">{config.theme()}</span>
      <span data-testid="density">{config.density()}</span>
      <span data-testid="direction">{config.direction()}</span>
      <span data-testid="z-index-base">{config.zIndexBase()}</span>
    </div>
  );
}

describe('ConfigProvider', () => {
  it('provides default configuration through context', () => {
    render(() => (
      <ConfigProvider>
        <Probe />
      </ConfigProvider>
    ));

    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN');
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('density')).toHaveTextContent('default');
    expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
    expect(screen.getByTestId('z-index-base')).toHaveTextContent('0');
  });

  it('reflects configured values on context getters and the root element', () => {
    render(() => (
      <ConfigProvider theme="dark" density="compact" direction="rtl" zIndexBase={1000}>
        <Probe />
      </ConfigProvider>
    ));

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('density')).toHaveTextContent('compact');
    expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
    expect(screen.getByTestId('z-index-base')).toHaveTextContent('1000');

    const root = screen.getByTestId('probe').closest('[data-scui-theme]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-scui-theme', 'dark');
    expect(root).toHaveAttribute('data-scui-density', 'compact');
    expect(root).toHaveAttribute('data-scui-direction', 'rtl');
  });

  it('stays reactive when the theme accessor changes', () => {
    const [theme, setTheme] = createSignal<ThemeName>('light');

    render(() => (
      <ConfigProvider theme={theme}>
        <Probe />
      </ConfigProvider>
    ));

    const root = screen.getByTestId('probe').closest('[data-scui-theme]');
    expect(root).not.toBeNull();
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(root).toHaveAttribute('data-scui-theme', 'light');

    setTheme('dark');

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(root).toHaveAttribute('data-scui-theme', 'dark');
  });

  it('throws when useConfig is called outside of ConfigProvider', () => {
    expect(() => render(() => <OutsideConsumer />)).toThrow(
      '[solid-craft-ui] useConfig() must be used within <ConfigProvider>',
    );
  });
});
