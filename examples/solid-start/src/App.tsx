import { Button, Col, ConfigProvider, Divider, Icon, Row, Space, Text, Title } from 'solid-craft';
import { createUniqueId } from 'solid-js';

/**
 * 最小 SSR 消费页面：覆盖 ConfigProvider、Button 默认值、布局与栅格、
 * 图标、Typography，并用 createUniqueId() 验证 SSR / hydration 的确定性 ID。
 */
export function App() {
  const stableId = createUniqueId();

  return (
    <ConfigProvider theme="light" density="default" direction="ltr">
      <main data-testid="app-root">
        <Title level={2}>SSR 冒烟</Title>
        <Space size="medium">
          <Button
            onClick={() => {
              // 只有 hydration 成功后事件委托才会把 click 送到这里。
              const scope = globalThis as typeof globalThis & { uiSmokeClicks?: number };
              scope.uiSmokeClicks = (scope.uiSmokeClicks ?? 0) + 1;
            }}
          >
            默认按钮
          </Button>
          <Button variant="outline" color="neutral">
            中性按钮
          </Button>
        </Space>
        <Divider>分割线</Divider>
        <Row gutter="large">
          <Col span={12} md={8}>
            <Text>左列</Text>
          </Col>
          <Col span={12} md={16}>
            <Text tone="secondary">右列</Text>
          </Col>
        </Row>
        <Icon label="状态图标" size="small" tone="success">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <circle cx="8" cy="8" r="6" fill="currentColor" />
          </svg>
        </Icon>
        <span data-testid="stable-id">{stableId}</span>
      </main>
    </ConfigProvider>
  );
}
