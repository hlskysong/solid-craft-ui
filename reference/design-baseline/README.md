# 设计基线对照（reference/design-baseline）

把 `docs/03 §1`「视觉与交互以 TDesign / Ant Design / Semi Design 的公开文档与 Demo 为参考」这句**无法核验**的话，换成一张有数值、有出处、有判定理由的台帐。

存在的直接原因：2026-11-12 Aming 指出「无 Figma 设计稿」被当成了「无设计输入」，而三家其实都公开了 Figma / MasterGo / Sketch 物料，且 npm 包里就有比 Figma 更精确的数值真源。本目录是对这次质疑的数据化回应。

## 目录

| 文件 | 作用 | 谁维护 |
| --- | --- | --- |
| `compare.json` | **判定真源**：22 个维度 × 4 家取值 + 判定 + 理由 | 人写（判定要理由） |
| `compare.md` | 由 `compare.json` 渲染的人读台帐 | 机器生成，勿手改 |
| `raw/upstream-values.json` | 从上游包内源文件抽取的原始数值 + 出处 | 机器生成 |
| `fetch-upstream.mjs` | 下载并解包上游包到 `.cache/`（已 gitignore） | — |
| `refresh.mjs` | 重新抽取 `raw/upstream-values.json` | — |
| `report.mjs` | 由 `compare.json` 重渲染 `compare.md` | — |
| `probe-registry.mjs` | 探测上游包版本与 tarball 是否可达 | — |

## 刷新方式

```sh
# shell: sh
node reference/design-baseline/fetch-upstream.mjs   # 首次或换版本时
node reference/design-baseline/refresh.mjs
node reference/design-baseline/report.mjs
```

上游升级后 diff `raw/upstream-values.json` 就知道哪些数值变了。`compare.json` 的判定**不会**自动跟着变 —— 那是刻意的：判定要人重新看一遍才能改。

## 判定枚举

| 值 | 含义 | 动作 |
| --- | --- | --- |
| `consistent` | 与至少两家上游相同 | 无需动作 |
| `deliberate` | 有依据的偏离（对比度 / 品牌 / 路线选择） | 把理由写进规范正文，否则等于没依据 |
| `undecided` | 没有依据的偏离 | 建议对齐上游，属优先项 |
| `gap` | 上游有、我们缺 | 按组件排期补，相关组件落地前必须补 |
| `pending` | 组件未实现 | 先记录目标值，落地时锚定 |

## 本批次已回写（2026-11-12 第二轮，Aming 全部采纳）

`docs/01~07` 是 `check:goals` 的 SHA256 冻结基线，改动经 Aming 确认后已落盘并 `--update-baseline` 重校：

| 位置 | 改动 |
| --- | --- |
| `03 §1` | 把「没有 Figma」拆成「无甲方设计稿」+「三家物料公开」，锁定参考版本，指明以包内变量源为真源 |
| `03 §2.4`（新增） | 十类 token 的落地状态：字号已补，阴影 / 层级 / 字族仍缺 |
| `03 §12` | 标题改「无甲方设计稿」；流程图参考环节补「版本锁定 · 包内变量源 · 数值对标台账」；约定新增「改数值前先补台账行」 |
| `07 Q2 / R4` | 补参考版本号与台账指针；R4 缓解措施补判定枚举（「以三家为参考」本身就是风险成因） |
| `04 §5.1` | Table 密度目标 12/12 默认、16/16 舒适、8/8 紧凑；表头与正文同字号 |
| `04` 验收项 | 差异必须落到 `compare.json` 并给出判定，刻意偏离须附依据 |

## 边界

- **不参与 `pnpm verify`**：参考资料不是产物，也不该让 CI 联网。新增 `reference/**` 不触发任何门禁（`docs/01~07` 的 SHA256 基线不含本目录）。
- **`docs/01~07` 仍是冻结基线**：后续任何回写都要先经 Aming 确认，改完跑 `pnpm check:goals --update-baseline`。本目录只提供数据与建议，不自行改正文。
- **`.cache/` 与 `raw/` 的地位不同**：`.cache/` 是上游解包缓存（gitignore，可随时 `fetch-upstream.mjs` 重建）；`raw/upstream-values.json` 是锁定版本的取值快照，必须入库，否则判定无从复核。
- **不复制上游视觉资产**：只比数值与结构。三家均 MIT，但仍须保持品牌差异。
- 版本已锁定在 `compare.json → upstream.pinned`，跨版本对比不成立。
