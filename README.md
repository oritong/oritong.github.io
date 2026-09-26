# Oritong · 个人空间

哦里冻的个人网站：个人介绍、项目记录、项目 Wiki、常用资源与个人图库。原生 HTML / CSS / JavaScript，无需安装依赖或构建，可发布到 GitHub Pages。

## 本地预览

直接打开 `index.html` 即可浏览，也可以使用任意静态服务器。安装了 Node.js 时：

```sh
node scripts/serve.cjs
```

默认仅在本机的 4173 端口提供预览。端口被占用时使用 `node scripts/serve.cjs 4174`，或传入 `0` 自动选择空闲端口。终端会输出实际地址。预览服务器不是生产后端。

## 发布到 GitHub Pages

1. 将站点文件推送到 GitHub 仓库。
2. 打开 **Settings → Pages**。
3. 选择 **Deploy from a branch**、发布分支和 `/(root)` 目录。
4. 保存并等待部署，使用 Pages 显示的地址访问。

保留 `.nojekyll`。项目仓库与个人主页仓库都可使用；自定义域名在 Pages 设置中配置。所有内部导航使用 Hash，不依赖服务器 URL 重写。

## 文件职责

- `index.html`：语义化外壳、导航、搜索、页脚、外观设置。
- `content.js`：个人资料、项目、文档、资源和图库数据。
- `site-core.js`：无 DOM 的路由、文档解析、项目集合和搜索索引。
- `app.js`：页面模板、交互、元信息、键盘与焦点管理。
- `styles.css`：语义化 Token、共用组件、响应式与打印样式。
- `starfield.js`：默认开启缓慢星空、低频随机流星与鼠标星星拖尾，支持分别关闭背景和拖尾。
- `docs/`：审查、设计与验收记录；不参与页面运行。
- `tests/`、`scripts/`：可选开发检查与本地预览；不影响静态发布。

## 修改内容

内容集中维护在 `content.js`：

- `profile`：姓名、身份、头像、介绍、外部主页、群号。不要添加尚未确认的个人信息。
- `home.featuredProjects`：首页精选项目 ID，目前只选钻石大陆加豪版。它是编辑选择，不是按日期推测的“最新项目”。
- `home.currentProjects`：正在维护或整理的项目 ID，手动维护。
- `resources`：名称、分类、介绍、网址；原有分类筛选仍可使用，筛选状态保存在地址中。
- `projects` / `participations`：个人项目与参与项目，统一进入列表、搜索与 Wiki 查询。
- `gallery.artworks`：沿用图片路径、标题、alt、画师、画师主页和可选日期/说明。

项目可包含 `description`（展示简介）、`summary`、`kind`、`status`、`tags`、`role`、`outcome`、`year`、`links: [{ label, url }]`。

只有真实提供的外部链接才会生成按钮；没有 GitHub 仓库或下载地址时，不显示占位链接。项目可以省略 `pages` 或使用空数组，项目介绍仍正常显示。旧 `wikiTheme` 字段作为历史数据保留，新界面统一使用站点的文档阅读主题。

### Wiki 内容

保留兼容格式：

```js
{
  id: "your-page-id",
  title: "文章标题",
  section: "01",
  description: "可选的文章摘要",
  body: ["第一段正文", "第二段正文"]
}
```

- `id` 必须在项目内唯一并保持稳定。第一篇文章是项目默认文档，不强制要求 `overview`。
- `headings: [{ before: 0, id: "intro", title: "开始之前" }]` 可在原有段落前插入二级标题；超过一个标题时自动生成页内目录。
- `callouts: [1]` 将指定索引的段落显示为注意提示。
- `snippets: [{ after: 2, language: "JavaScript", caption: "代码说明", text: "代码文本" }]` 在指定段落后插入可复制代码。
- 可选 `status`、`version`、`updatedAt`：只填写真实状态、版本和日期，不自动补齐。
- 复杂文档可改用 `blocks`，支持 `paragraph`、`heading`、`subheading`、`callout`、`code`、`list`、`table`。列表使用 `items` 和可选 `ordered`；表格使用 `headers`、`rows` 和可选 `caption`。存在 `blocks` 时以它为展示来源。
- 这不是完整 Markdown 解析器。正文会转义 HTML；反引号可标记行内代码。

## 路由兼容

原有六个栏目与六篇文档地址保留。新增：

- `#/projects/:projectId`：项目介绍。
- `#/wiki`：Wiki 总目录。
- `#/wiki/:projectId`：规范化到该项目第一篇文章。
- `#/wiki/:projectId/:pageId?section=:headingId`：可分享的文章内位置。
- `#/resources/resource-N`、`#/gallery/artwork-N`：搜索精确定位到条目。

旧钻石大陆 `/overview` 地址兼容跳转到 `/translation-method`。其他未知项目/文章显示明确的恢复页面，不再回退到无关内容。资源与图库的 N 对应数组顺序，重排内容后序号链接可能改变；已有 Wiki ID 不受影响。

## 外观与动画

`styles.css` 的 `:root` 定义颜色、字号、间距和圆角。午夜蓝底色、冰青主色和少量浅紫强调，配合静态细网格、几何头像框、等宽注记与清晰的面板边线。文档与主页共用颜色和组件，Wiki 正文保持纯色背景。

页脚“外观设置”可独立切换“背景星空与流星”和“星星拖尾”，两项默认开启，尊重已保存的开关选择。背景星星缓慢漂移，流星的位置、角度、速度与颜色随机；首次约 1.5–3 秒出现，后续宽屏每 5–11 秒、小屏每 10–18 秒出现一颗，并在 1.1–1.8 秒内淡出。系统启用“减少动态效果”时，两项都关闭并禁用控制。触屏不生成鼠标拖尾，后台标签不持续绘制；背景关闭且最后一颗拖尾星消退后停止请求动画帧。最多保留 28 颗拖尾星，每颗在 0.8 秒内消退，不拦截点击、不隐藏鼠标。

网格和面板由 CSS 实现，星星由 Canvas 实时绘制，不使用生成图片、Base64、图片下载或动画库。原来的 `assets/cover.jpg` 不再引用。Google Fonts 不可用时使用系统字体。

## 图库与素材

只把经过授权、缩小尺寸并加可见署名水印的展示副本放入 `assets/gallery`，原稿存放在仓库之外。当前改造只调整网页布局，没有重新读取、压缩、重命名或转换任何图片文件。

图库不提供原图链接或下载按钮。图片区域禁止拖拽与右键，画师链接仍支持正常操作。网页上的使用提示不是文件本身的水印；静态网站不能完全阻止截图或保存公开资源。不要将作品用于 AI 训练。

## 验证

无需额外依赖的源码回归：

```sh
node --test tests/site-core.test.cjs
```

可选浏览器检查：`node tests/browser-smoke.cjs`。需要可用的 Playwright 和浏览器；可用环境变量 `PLAYWRIGHT_MODULE` 指向现有 Playwright 模块、`BROWSER_EXECUTABLE` 指向现有浏览器，不是站点运行依赖。脚本启动随机本地端口，结束后自动关闭；阻断图片与外部请求，不生成截图，不处理素材。检查结果写入 `docs/browser-checks.json`。

检查覆盖路由、页面标题、响应式、重复 ID、搜索、菜单、复制、筛选和减少动态设置；不能替代真实辅助技术、网络字体可用性或素材视觉验收。
