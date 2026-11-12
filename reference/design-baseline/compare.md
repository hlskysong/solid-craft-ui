# 设计基线对照台帐

> v1 · 2026-11-12（第三轮：字族与图标尺寸收口） · 由 `report.mjs` 从 `compare.json` 生成，**不要手改本文件**。
>
> 目的：把 docs/03 §1「参考 TDesign / Ant Design / Semi Design」这句无法核验的话，换成一张有数值、有出处、有判定理由的表。
> 判据不是「像不像」，而是「同不同 + 是否有理由」。

## 1. 上游版本锁定

| 库 | 锁定版本 |
| --- | --- |
| antd | 6.7.0 |
| tdesign | tdesign-vue-next 1.20.11 / tdesign-common main（2026-11-12 快照） |
| semi | 2.104.0 |

上游值随版本漂移，任何一次对齐都必须重跑 refresh.mjs 并核对 raw/upstream-values.json；本表数值对应上表锁定的版本。

数值抽取自 `raw/upstream-values.json`，由 `refresh.mjs` 从上游包内源文件解析，出处见各行「出处」列与 raw 文件的 `source` 字段。

## 2. 结论摘要

| 判定 | 项数 |
| --- | --- |
| ❗ 待裁决 | 2 |
| 🕳 能力缺口 | 6 |
| ⚠️ 刻意偏离 | 7 |
| 📌 待落地锚定 | 1 |
| ✅ 一致 | 7 |

读法：**待裁决**要先动，**能力缺口**按组件排期动，**刻意偏离**只需补理由，**一致**项不用管。

## 3. 逐项对照

### ❗ 待裁决（2 项）

> 没有依据的偏离，建议对齐上游

| 维度 | 本仓（scui） | Ant Design | TDesign | Semi | 出处 |
| --- | --- | --- | --- | --- | --- |
| 中性色双轨 | palette.neutral-1…10 与 color-neutral-0/25/50/100/300/500/800/900/1000 两套并存 | colorText/colorBg/colorFill/colorBorder 语义化派生 | --td-gray-color-1…13 单一阶梯 | --semi-grey-0…9 单一阶梯 | `packages/tokens/dist/css/tokens.css` |
| 动效档位 | 单档 120ms + cubic-bezier(0.2,0,0,1) | 100 / 200 / 300ms + 5 条曲线 | transition: all 0.2s linear（组件内联） | 组件级 transition 变量 | `packages/tokens/tokens/semantic/light.json · motion` |

- **中性色双轨** — 同一套灰阶存在两套编号，组件引用哪套全靠人记；建议二选一（保留 10 级阶梯，把 0/25/50… 别名映射过去），否则后续接入主题工具必冲突。
- **动效档位** — 单档够用，但 Modal / Drawer 的进出场 120ms 偏快（AntD 用 200–300ms）。建议保留 fast 120ms，补 slow 240ms，而不是引 5 条曲线。

### 🕳 能力缺口（6 项）

> 上游有、我们缺，落地相关组件前必须补

| 维度 | 本仓（scui） | Ant Design | TDesign | Semi | 出处 |
| --- | --- | --- | --- | --- | --- |
| 色相覆盖面 | 6 色相 × 10 级（blue/green/amber/red/cyan/neutral） | 13 预设色相 × 10 级 | brand 10 级 + gray 13 级 + font-gray 4 级 | 16 色相 × 10 级（0–9） | `packages/tokens/scripts/palette.mjs · HUES` |
| 排版 token 是否存在 | font-size / line-height（8 档各 8 个变量）+ font-family / font-family-code（按 03 §4.1 系统字体栈）均已建 token | fontSize* / lineHeight* 全套语义 token | --td-font-size-* / --td-text-line-height-* / --td-font-body-* | $font-size-* / 组件级行高变量 | `packages/tokens/dist/css/tokens.css:89-109 · packages/core/src/styles/base.scss` |
| 圆角标尺 | 4 / 6 / 8 | 2 / 4 / 6 / 8（+ outer 4） | 2 / 3 / 6 / 9 | 3 / 6 / 12 | `packages/tokens/tokens/primitive/scale.json` |
| 间距标尺 | 4 / 8 / 12 / 16 / 24 / 32 | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 | 2 / 4 / 6 / 8 / 12 / 16 / 20 / 24 / … / 72 | 2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 | `packages/tokens/tokens/primitive/scale.json` |
| 阴影层级 | 无（08 文档提到 shadow，产物里没有） | 3 层（Tertiary / Secondary / 主 boxShadow） | --td-shadow-1/2/3 | elevated / floating / knob | `packages/tokens/dist/css/tokens.css（无 shadow 段）` |
| 层级阶梯 | 无 z-index token，app.scss 用 calc(var(--scui-z-index-base, 0) + 1000) 兜底 | zIndexPopupBase 1000 + 各层级派生 | --td-z-index-* 阶梯 | z-index 常量表 | `packages/core/src/components/app/app.scss:14` |

- **色相覆盖面** — 中后台高频缺 violet/purple（图表与标签区分），建议下一版补到 8 色相，而不是一次追平 13/16。
- **排版 token 是否存在** — 2026-11-12 两次补齐：先字号与行高（Typography / Divider / Textarea 计数器 / Form 错误文案从「借 space 当字号」与「写死 0.875em、1.5」改为引用 token），再补字族（body 用 :where() 零特异性声明，消费方一条普通规则即可覆盖）。同时清掉 `scui-monospace`：全仓 4 处引用、0 处 @font-face 定义，是永远不会解析的死名。
- **圆角标尺** — 缺 2px（tag / badge / checkbox / 小标签）与 12px（modal / drawer 容器）。落地 Tag、Modal 时必然要新增，提前补比临时加更稳。
- **间距标尺** — 缺 2（描边微调、icon 间隙）与 20（表单行内 gap）、40（页面级留白）。20 缺口已经在 layout/grid 里体现为写死数值，建议同期补。
- **阴影层级** — Dropdown / Select 弹层、Modal 现在都用裸 border 或浏览器默认阴影顶着。落地 Modal 前必须补 shadow-popup / shadow-modal 两档。
- **层级阶梯** — fallback 说明「token 不存在」这件事代码里自己承认了。补 5 档（dropdown/sticky/modal/drawer/message）即可，不需要照抄 20 档。

### ⚠️ 刻意偏离（7 项）

> 有依据的偏离，但理由必须落到规范正文

| 维度 | 本仓（scui） | Ant Design | TDesign | Semi | 出处 |
| --- | --- | --- | --- | --- | --- |
| 主色 | #2d66f5（palette.blue.6） | #1677ff | #366ef4（brand-6；历史主色 #0052d9 已降为 brand-7） | #0064fa | `packages/tokens/scripts/palette.mjs · BASES.light.blue` |
| 三级文本色 | rgba(0,0,0,0.55)（实测 ≈4.74:1） | rgba(0,0,0,0.45) | rgba(0,0,0,0.4) | grey-9 × 0.62 | `docs/03 §2 + semantic/light.json（v0.2 修正记录）` |
| 危险色 | #dc2626 | #ff4d4f | 品牌红阶（--td-error-color） | red-5（#f93920 系） | `packages/tokens/scripts/palette.mjs · BASES.light.red` |
| 字号阶 | 12 / 13 / 14 / 16 / 20 / 24 / 30 / 38（03 §4.2 八档，已全部落地） | 12 / 14 / 16 / 20 / 24（genFontSizes 生成） | 12 / 14 / 16 / 24 / 28 / 36 | 12 / 14 / 16 / 18 / 20 / 24 / 28 / 32 | `packages/tokens/tokens/primitive/type.json` |
| 图标尺寸 | sm 12 / md 16 / lg 20（--scui-icon-size-*；改前为 8 / 12 / 16） | `.anticon` 继承 1em（基准 14） | --td-comp-size-xs 16 起（图标取 comp-size 档） | 8 / 12 / 16 / 20 / 24 五档（extra-small…extra-large） | `packages/tokens/tokens/primitive/type.json · packages/core/src/components/icon/icon.scss` |
| 按钮圆角 | 6px | 6px（borderRadius 全局值） | 3px | 3px | `packages/tokens/tokens/component/button.json` |
| 控件边框色 | #949494（对白底 ≈3.0:1） | #d9d9d9（≈1.4:1） | #ddd（≈1.3:1） | grey 系浅描边 | `packages/tokens/tokens/semantic/light.json · border.strong` |

- **主色** — 三家主色互不相同，说明品牌色本就不该照抄；自持 seed 是正确做法。TDesign 把 #0052d9 从主色降为 brand-7 这件事，正好证明「不锁版本的对标等于没对标」。待办只有一件：在品牌说明里写死 seed 与推导方式，别让 #2f6bff 这类历史字面量继续漂在产物里。
- **三级文本色** — 刻意偏离：0.45/0.40 在 14px 正文下达不到 WCAG AA 4.5:1，0.55 是唯一能过的档位。理由要写进 03（当前仅在 token 的 usage 注释里）。
- **危险色** — 刻意偏离：AntD #ff4d4f 对白底仅 ≈3.3:1，做正文级错误提示不合规；#dc2626 更深但保住了 AA。
- **字号阶** — 与三家重叠 12/14/16/20/24 五档。13（紧凑表格）是 §4.2 独有；顶端 30/38 对应 TDesign 的 28/36、Semi 的 28/32，属规范已冻结的取值差异，不构成偏离依据缺失 —— 依据是 §4.2 正文。
- **图标尺寸** — 改前 8/12/16 是「space-2/3/4 的副产物」：medium 12 比正文 14 还小，且直接违反 03 §10「默认 16px；导航/工具栏 20px」。对齐 Semi 的 small/default/large 三档后，medium=16 才等于主流默认。只取三档、不取 8 与 24，是因为 8px 图标在 14px 正文旁不可辨、24 交给空状态独立取值。
- **按钮圆角** — 选了 AntD 一路。要写明这是路线选择而非疏漏，否则后续每接一个组件都会被问一次。
- **控件边框色** — 刻意偏离，依据 WCAG 1.4.11「非文本对比度 ≥3:1」。代价是与国内主流后台观感差异明显（我们更深），这是设计评审必须知情的取舍，不能只留在 token 注释里。

### 📌 待落地锚定（1 项）

> 组件未实现，先把目标值记录下来

| 维度 | 本仓（scui） | Ant Design | TDesign | Semi | 出处 |
| --- | --- | --- | --- | --- | --- |
| 表格密度（未实现） | 04 §5.1 已锚定目标：默认 12/12，可选 16/16（舒适）、8/8（紧凑）；Table 未实现 | cellPaddingBlock 16 / Inline 16；md 12 / 8；sm 8 / 8 | comp-size 阶梯 + 行内 padding | 表格行高变量 | `antd/es/table/style/index.js:207-212` |

- **表格密度（未实现）** — 表格是核心场景。2026-11-12 已把目标值写进 04 §5.1，明确不沿用 AntD 默认 16/16：我们坚持高密度就从 12/12 起。落地时直接按此实现，不再二次讨论。

### ✅ 一致（7 项）

> 与至少两家上游相同，无需动作

| 维度 | 本仓（scui） | Ant Design | TDesign | Semi | 出处 |
| --- | --- | --- | --- | --- | --- |
| 主文本色 | rgba(0,0,0,0.88) | rgba(0,0,0,0.88) | rgba(0,0,0,0.9) | grey-9 × 1.0 | `packages/tokens/tokens/semantic/light.json` |
| 次要文本色 | rgba(0,0,0,0.65) | rgba(0,0,0,0.65) | rgba(0,0,0,0.6) | grey-9 × 0.8 | `packages/tokens/tokens/semantic/light.json` |
| 禁用文本色 | rgba(0,0,0,0.25) | rgba(0,0,0,0.25) | rgba(0,0,0,0.26) | grey-9 × 0.35 | `packages/tokens/tokens/semantic/light.json` |
| 基准字号 | 14px（--scui-font-size-md；body 基线同步 14/22，2026-11-12 对齐） | 14px | 14px | 14px | `packages/tokens/tokens/primitive/type.json · packages/core/src/styles/base.scss` |
| 控件高度三档 | 24 / 32 / 40 | 24 / 32 / 40（controlHeight 32 × 0.75 / 1 / 1.25） | 24 / 32 / 40（comp-size-xs/m/xl） | 24 / 32 / 40 | `packages/tokens/tokens/component/button.json` |
| 按钮横向内距 | 12px（space-3） | 15px（paddingContentHorizontal 16 - lineWidth 1） | 12px（comp-paddingLR-m = size-5） | 12px（spacing-base-tight） | `packages/core/src/components/button/button.scss:5` |
| 边框宽度 | 1px | 1px（lineWidth） | 1px | 1px（border-thickness-control） | `packages/core/src/components/button/button.scss:19` |

- **主文本色** — 与 AntD 完全一致。
- **次要文本色** — 与 AntD 一致，落在 TDesign/Semi 之间。
- **禁用文本色** — AntD 同值，且已按 03 §3.1 豁免对比度。
- **基准字号** — 原为 16px（typography 借 --scui-space-4），与三家 14 相反且违反 03 §1「高效优先」。2026-11-12 已按 03 §4.2 建 fontSize/lineHeight token 并落到 body 基线，实测产物 --scui-font-size-md: 14px。
- **控件高度三档** — 四家完全一致，是本次对照里最干净的一项。
- **按钮横向内距** — 三家两票 12，我们跟了多数派；AntD 的 15 属其历史包袱，不必跟。
- **边框宽度** — 一致。

## 4. 复现方式

```sh
# shell: sh
node reference/design-baseline/fetch-upstream.mjs   # 下载并解包上游包到 .cache/（已 gitignore）
node reference/design-baseline/refresh.mjs          # 重新抽取 raw/upstream-values.json
node reference/design-baseline/report.mjs           # 由 compare.json 重渲染本文件
```

上游升级后重跑这三步，diff `raw/upstream-values.json` 就知道哪些数值变了；`compare.json` 里的判定不会自动跟着变，需要人重新裁决 —— 这是刻意的。

## 5. 边界

- 本目录**不参与** `pnpm verify`：它是参考资料，不是产物，也不该在 CI 里联网。
- `docs/01~07` 是 SHA256 冻结基线，本批次**未改其一字节**；需要落到规范正文的结论以「待人工确认的改动建议」形式提交，由 Aming 决定是否 `check:goals --update-baseline`。
- 只比数值与结构，不复制上游视觉资产（三家均 MIT，但仍须保持品牌差异）。
