# Oritong · 个人档案站

一个原生 HTML、CSS 和 JavaScript 构建的中文个人站点，可直接发布到 GitHub Pages，无需安装依赖或运行构建命令。

## 本地预览

直接打开 `index.html` 即可预览。也可以在仓库目录启动任意静态文件服务器。

## 发布到 GitHub Pages

1. 将文件推送到 GitHub 仓库。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择要发布的分支和 `/(root)` 目录并保存。
5. 等待 Pages 完成发布，随后打开页面显示的站点地址。

仓库名可以使用普通项目名，也可以使用 `用户名.github.io` 创建个人主页地址。自定义域名可在 Pages 设置中配置。

## 更新站点内容

编辑 `content.js`：

- `profile` 保存个人名称、介绍文案、本地头像、`links` 外部主页列表，以及 `groups` QQ 群号列表。
- `resources` 保存资源名称、分类、说明与网址。
- `projects` 保存个人项目及其 Wiki 页面。
- `participations` 保存参与的团队项目或开源协作，字段格式与 `projects` 相同。
- `gallery.artworks` 保存图库稿件；只把加过委托人和画师水印的展示副本放入 `assets/gallery`，条目填写 `image`、`title`、`artist`、`date` 和可选的 `note`。原稿保存在仓库之外。

每个项目的 `pages` 数组包含 Wiki 目录。复制一个页面条目并修改 `id`、`title`、`section` 和 `body` 即可增加章节。编辑后刷新网页即可看到更新。

## 星空主题

全站使用深色半透明面板，背景由 `starfield.js` 通过 Canvas 绘制，不依赖生成图片、图片下载或第三方动画库。封面轨道装饰使用 CSS 绘制。

- 背景星点分层漂移、缓慢闪烁；鼠标移动产生逐渐消散的五角星拖尾。
- 拖尾在独立透明画布上显示，不阻挡链接点击、搜索和滚动；触屏设备不生成鼠标拖尾。
- 侧栏“星空动态”按钮可暂停或开启动态；系统启用“减少动态效果”时默认显示静态星空，切到后台时自动停止绘制。
- 在 `starfield.js` 顶部的 `SETTINGS` 中调整星点数量、移动速度和拖尾寿命；主题颜色位于 `styles.css` 的 `:root` 中。

原来的照片封面已替换，`assets/cover.jpg` 不再自动加载。

图库不提供原图链接或下载按钮，并在浏览器中禁用作品图片的右键菜单与拖拽。公开展示的副本建议先缩小尺寸并加上可见署名水印；静态网站无法阻止截图或通过浏览器开发工具获取图片，所以不能完全保证图片不会被保存。
