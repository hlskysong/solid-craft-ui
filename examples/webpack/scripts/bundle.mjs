/**
 * 用 webpack Node API 构建，避免 webpack-cli 首次运行的交互式安装提示。
 * 配置仍在 webpack.config.mjs（RecordCoreModules 插件写 dist/resolved.json）。
 */
import config from '../webpack.config.mjs';
import webpack from 'webpack';

webpack(config, (error, stats) => {
  if (error) {
    console.error(error);
    process.exitCode = 1;
    return;
  }
  if (!stats) {
    console.error('webpack returned no stats');
    process.exitCode = 1;
    return;
  }
  const info = stats.toJson({ all: false, errors: true, warnings: true });
  if (stats.hasErrors()) {
    console.error(info.errors);
    process.exitCode = 1;
    return;
  }
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
  console.log(stats.toString({ colors: false, chunks: false, modules: false }));
});
