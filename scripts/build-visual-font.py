#!/usr/bin/env python3
"""重新生成视觉基线固定字体（docs/08 §30.9，方案 B：仓库内固定 Web 字体）。

用途：把 16 张 light/ltr/default 截图的中文渲染从「macOS 系统字体」切换到仓库内
随包的开源字体子集，使本机与 CI runner 的字体集不再参与像素比对。

用法（需 Python 3 + fontTools + brotli；**只在重新生成时手动运行**，
pnpm verify 不依赖 Python，也不会执行本脚本）：

    python3 scripts/build-visual-font.py \
        --source <NotoSansSC[wght].ttf> \
        --out apps/docs/public/fonts/scui-visual.woff2 \
        --charset-out apps/docs/public/fonts/charset.txt

源字体：Google Fonts `ofl/notosanssc/NotoSansSC[wght].ttf`（可变字重 100~900，
SIL Open Font License 1.1，版权声明含 Reserved Font Name 'Source'）。
许可全文随字体放在同目录 `OFL.txt`；本脚本产出的是子集修改版，故把字体内部
family / full / PostScript name 改为 `SCUI Visual`（不含保留名 'Source'）。

字集口径（**必须与 scripts/check-ci.mjs 的字体契约判据逐字一致**）：
  - 遍历 `apps/docs/src` 下所有文本源文件（ts/tsx/css/scss/json/md/html/js/mjs），
    收集其中全部「可独立成字形」的 U+007F 以上字符（CJK + 中文标点 + §·× 等），
    排序去重写入 charset.txt；变体选择符（⚠️ 的 U+FE0F）、零宽字符、组合附加符号
    不单独渲染，由 renderable() 排除，否则源字体无对应字形会让断言失败；
  - 可打印 ASCII U+0020–U+007E 固定隐含，不写入清单；
  - 字体只作用于 `.demo-root`（无 chrome 截图宿主 / Demo 页），但字集覆盖整个
    docs 源码树：宿主固定文案、组件标题、Demo 描述都可能进入截图，
    宁可多收注释里的字，也不能让某个字形悄悄回退到系统字体再造成漂移。

新增汉字会使 `pnpm check:ci` 红灯：届时重新运行本脚本、更新
check-ci.mjs 的 FONT_SHA256，并跑 `pnpm test:visual:update` 重生成 16 张基线。
"""

import argparse
import hashlib
import pathlib
import sys

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit('缺少 fontTools：python3 -m pip install fonttools brotli')

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS_SRC = REPO_ROOT / 'apps' / 'docs' / 'src'
TEXT_SUFFIXES = {'.ts', '.tsx', '.css', '.scss', '.json', '.md', '.html', '.js', '.mjs'}
FAMILY = 'SCUI Visual'


def renderable(cp):
    """口径必须与 scripts/check-ci.mjs 的 isRenderable 完全一致。"""
    if cp <= 0x7F:
        return False
    if 0xFE00 <= cp <= 0xFE0F:  # 变体选择符（⚠️ 等 emoji 后缀）
        return False
    if 0x1F3FB <= cp <= 0x1F3FF:  # emoji 肤色修饰符
        return False
    if cp in (0x200B, 0x200C, 0x200D, 0x200E, 0x200F, 0x2060, 0xFEFF, 0x00AD):
        return False
    if 0x0300 <= cp <= 0x036F:  # 组合附加符号
        return False
    return True


def collect_charset():
    """扫描 docs 源码树，返回 (码位集合, 排序后的清单字符串)。"""
    codepoints = set(range(0x20, 0x7F))
    listed = set()
    files = sorted(
        f for f in DOCS_SRC.rglob('*') if f.is_file() and f.suffix in TEXT_SUFFIXES
    )
    if not files:
        sys.exit(f'未找到 docs 源码文本：{DOCS_SRC}')
    for file in files:
        for char in file.read_text(encoding='utf-8', errors='ignore'):
            cp = ord(char)
            if renderable(cp):
                listed.add(char)
                codepoints.add(cp)
    return codepoints, ''.join(sorted(listed))


def rename(font, family):
    """子集修改版改用自有 family，避免被当作原版字体分发（OFL 第 3 条）。"""
    table = font['name']
    combos = {
        (rec.platformID, rec.platEncID, rec.langID)
        for rec in table.names
        if rec.nameID in (1, 4, 6)
    }
    labels = {1: family, 4: family, 6: family.replace(' ', '')}
    for platform_id, enc_id, lang_id in combos:
        for name_id, value in labels.items():
            table.setName(value, name_id, platform_id, enc_id, lang_id)
    table.names = [rec for rec in table.names if rec.nameID not in (16, 17)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True, help='完整 Noto Sans SC 可变字体 TTF 路径')
    parser.add_argument('--out', required=True, help='输出 woff2 路径')
    parser.add_argument('--charset-out', required=True, help='输出字集清单路径')
    args = parser.parse_args()

    source = pathlib.Path(args.source)
    if not source.is_file():
        sys.exit(f'源字体不存在：{source}')

    cps, charset = collect_charset()
    font = TTFont(source)
    rename(font, FAMILY)

    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6]  # 0 是 OFL 要求随字体保留的版权声明
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=cps)
    sub.subset(font)

    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(out)

    # 生成时断言：目标码位必须全部有字形，否则浏览器会回退系统字体 → 视觉再次漂移
    built = TTFont(out)
    cmap = set()
    for table in built['cmap'].tables:
        cmap |= set(table.cmap.keys())
    missing = sorted(cps - cmap)
    if missing:
        sys.exit(f'子集字体缺少 {len(missing)} 个码位：{[hex(c) for c in missing[:10]]}')

    charset_out = pathlib.Path(args.charset_out)
    charset_out.parent.mkdir(parents=True, exist_ok=True)
    charset_out.write_text(charset + '\n', encoding='utf-8')

    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    print(f'字体：{out} ({out.stat().st_size} bytes)')
    print(f'字集：{len(charset)} 个 CJK/符号 + 95 个 ASCII，全部 {len(cps)} 个码位有字形')
    print(f'清单：{charset_out}')
    print(f'SHA256: {digest}')


if __name__ == '__main__':
    main()
