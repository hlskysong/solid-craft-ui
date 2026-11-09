import { createHandler, StartServer } from '@solidjs/start/server';

/**
 * 使用框架默认的 stream 模式：FileRoutes 是 lazy 的，renderToString(sync)
 * 不会等异步路由解析完成，会渲染出空壳（HTML 里残留 `_$HY.r[...]="$$f"`）。
 * response.text() 会等到流结束，冒烟脚本仍能拿到完整 HTML。
 */
export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <title>solid-craft-ui · SolidStart SSR smoke</title>
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
