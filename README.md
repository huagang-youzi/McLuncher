# McLuncher 官网

McLuncher 的官方分发与文档站点：纯静态、零后端、零第三方请求。
手写 HTML + 一份 CSS + 一份 JS，没有构建步骤，改完保存刷新即可生效。

- 产品：McLuncher（我的世界启动器，Windows 单文件免安装整包）
- 当前版本：v1.12.0（测试版）
- 作者 & 开发者：花冈柚子
- 品牌：全站与安装包统一使用 **McLuncher**，无任何旧品牌字样

## 页面结构

| 文件 | 页面 | 主要承担的事 |
| --- | --- | --- |
| `index.html` | 首页 | 品牌定位、六项能力、三步上手、当前版本规格 |
| `download.html` | 下载 | 主下载入口、SHA-256 校验与复制、安装包说明、四步上手、系统要求 |
| `guide.html` | 使用指南 | 下载安装 → 首次启动 → 建游戏 → 管理 → 资源库 → 快捷键 → 校验 → 排错（左侧目录可跳转） |
| `faq.html` | 常见问题 | 11 条折叠问答，支持关键词实时过滤 |
| `status.html` | 运行状态 | 静态托管事实清单，附自测命令 |
| `404.html` | 未找到 | 四个入口兜底，任何未知路径都能回到主流程 |

## 目录结构

```
.
├── index.html / download.html / guide.html / faq.html / status.html / 404.html
├── version.json              # 版本清单（桌面端「检查更新」读取此文件）
├── robots.txt
├── DEPLOY.md                 # 部署上线手册：品牌清单 + 四段式部署文档 + 故障排查
├── serve.py                  # 本地预览用的极简静态服务器（仅标准库）
├── tools/
│   ├── brand-check.py        # 品牌残留检查（文本 + 二进制 UTF-8/UTF-16 三层扫描）
│   └── health-check.py       # 上线健康检查（页面、MIME、404、下载包校验、TLS）
├── assets/
│   ├── css/main.css          # 设计令牌 + 全部页面样式
│   ├── js/site.js            # 配色切换、移动端抽屉、复制校验、问答过滤、滚动渐显、站点向导
│   └── img/
│       ├── favicon.svg
│       ├── yuzu_*.png        # 站点向导的三套立绘
│       └── wall/*            # 每页一张整幅壁纸
├── downloads/                # 安装包（随仓库分发，直链下载）
└── .gitcode-ci.yml           # 平台走 CI 产物模式时的兜底构建
```

## 本地预览

```bash
python serve.py          # http://127.0.0.1:8080
python serve.py 9000     # 指定端口
```

直接双击 `index.html` 也能看，但用服务器预览更接近线上（相对路径、404 落页行为一致）。

## 设计与实现要点

- **无 JS 也能读**：页头页脚是真实 HTML，正文与下载链接不依赖脚本；脚本只负责增强（配色、抽屉、过滤、看板娘）。
- **配色三态**：跟随系统 → 浅色 → 深色循环，写入 `localStorage`；`<head>` 内联脚本在首帧前定好主题，避免深色页面闪白。
- **响应式**：主要断点 860px（导航折叠为抽屉）、900px（指南侧栏目录转为可换行标签）、760px（页脚两列）、600px（看板娘缩小）。
- **页面壁纸**：每页由 `body[data-page]` 映射到 `assets/img/wall/` 下的一张图，`::before` 固定铺满、`::after` 叠渐变遮罩，避免移动端 `background-attachment: fixed` 的抖动。
- **可访问性**：跳过导航链接、`aria-current` 标注当前页、折叠面板用原生 `<details>`、`prefers-reduced-motion` 下关闭动效、全站可见焦点环。

## 部署上线

完整的环境准备、四段式部署步骤、访问方式与 10 类故障排查见 **[DEPLOY.md](DEPLOY.md)**，
文档开头含品牌声明与完整替换检查清单。

最短路径（GitCode Pages，零成本、无需服务器、无需备案）：

1. 仓库推到 GitCode 的 `master` 分支（本仓库已就绪）。
2. 仓库页面进入 **Pages**：模板选 **html**，分支选 **master**，目录填 `/`，保存。
3. 等 1–2 分钟，访问 `https://gitcode.host/wangmo99/McLuncher/`。

> 该平台没有 Pages 管理 API，开关只能在网页端点一次；`raw.gitcode.com` 直链强制返回
> `text/plain`，不能当静态站点用，必须走 Pages。

上线后一键体检：

```bash
python tools/health-check.py https://gitcode.host/wangmo99/McLuncher
python tools/brand-check.py .        # 品牌残留应为 0
```

## 日常维护

| 要做的事 | 改哪里 |
| --- | --- |
| 换安装包 / 升级版本号 | 替换 `downloads/` 里的文件，再改 `download.html` 里的大小、版本号、SHA-256，以及各页页头与页脚的版本标签 |
| 改文案 | 直接改对应 `.html` |
| 调配色 / 圆角 / 栅格 | `assets/css/main.css` 顶部的设计令牌 |
| 换壁纸 | 替换 `assets/img/wall/` 下的文件，或改 `main.css` 里 `body[data-page=...]` 的映射 |
| 换看板娘立绘 / 台词 | 立绘放 `assets/img/`，台词在 `assets/js/site.js` 的 `GUIDE` 对象里 |
