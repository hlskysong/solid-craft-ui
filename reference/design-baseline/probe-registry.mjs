/**
 * 一次性探针：确认上游包与文件路径是否可达（不放进门禁链）。
 * 用法：node reference/design-baseline/probe-registry.mjs
 */
const targets = [
  ['antd', 'https://registry.npmjs.org/antd/latest'],
  ['@ant-design/colors', 'https://registry.npmjs.org/@ant-design%2Fcolors/latest'],
  ['tdesign-common', 'https://registry.npmjs.org/tdesign-common/latest'],
  ['tdesign-vue-next', 'https://registry.npmjs.org/tdesign-vue-next/latest'],
  ['@douyinfe/semi-foundation', 'https://registry.npmjs.org/@douyinfe%2Fsemi-foundation/latest'],
  [
    '@douyinfe/semi-theme-default',
    'https://registry.npmjs.org/@douyinfe%2Fsemi-theme-default/latest',
  ],
];

for (const [name, url] of targets) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`${name}\tHTTP ${res.status}`);
      continue;
    }
    const json = await res.json();
    console.log(`${name}\t${json.version}\t${json.dist?.tarball ?? '-'}`);
  } catch (error) {
    console.log(`${name}\tERR ${error.message}`);
  }
}
