import { Button } from 'solid-craft/button';
import { ConfigProvider } from 'solid-craft/config-provider';
import { createUniqueId } from 'solid-js';

/** 首页：覆盖 ConfigProvider / Button，并用 createUniqueId 验证确定性 ID。 */
export default function Home() {
  const stableId = createUniqueId();
  return (
    <ConfigProvider theme="light" density="default" direction="ltr">
      <main data-testid="app-root">
        <Button>真实 SolidStart SSR</Button>
        <span data-testid="stable-id">{stableId}</span>
      </main>
    </ConfigProvider>
  );
}
