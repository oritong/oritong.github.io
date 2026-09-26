window.SITE_CONTENT = {
  profile: {
    name: "哦里冻",
    handle: "ORITONG",
    avatar: "assets/avatar.jpg",
    role: "Minecraft 整合包制作者 · Blophy 官方谱师",
    intro: "尝试将所有能做的做到最好，也想为你留住那一瞬的惊奇。",
    introduction: [
      "初次（也许不是）见面，欢迎来玩！",
      "我总想着把能做的都做到最好，最后却常常忙成一团糟……不过，意外也是故事的一部分嘛。",
      "我喜欢装满童话与梦想的世界，也想用自己的作品，为你留住那些让人惊叹的一瞬。",
      "平时制作 Minecraft 整合包，也担任游戏《Blophy》的官方谱师。",
      "如果你喜欢我的作品，欢迎来图库看看，也欢迎支持！"
    ],
    links: [
      { name: "Bilibili", label: "B 站", description: "视频与动态", url: "https://space.bilibili.com/494691236", mark: "B" },
      { name: "MC百科", label: "MC百科作者页", description: "整合包与 Minecraft 创作", url: "https://www.mcmod.cn/author/36024.html", mark: "MC" },
      { name: "GitHub", label: "GitHub", description: "开源项目与代码", url: "https://github.com/oritong", mark: "GH" },
      { name: "CurseForge", label: "CurseForge", description: "Minecraft 项目", url: "https://www.curseforge.com/members/oritong/projects", mark: "CF" },
      { name: "Modrinth", label: "Modrinth", description: "模组与整合包", url: "https://modrinth.com/user/oritong", mark: "MR" },
      { name: "XyeBBS", label: "XyeBBS", description: "社区主页", url: "https://www.xyebbs.com/members/49528", mark: "XY" },
      { name: "X", label: "X", description: "动态与近况", url: "https://x.com/_oritong_", mark: "X" },
      { name: "Discord", label: "Discord", description: "加入个人服务器", url: "https://discord.gg/4tR6FMmGJU", mark: "DC" }
    ],
    groups: [
      { label: "QQ 群", name: "我的 QQ 群", number: "946391190", description: "来群里找我玩" },
      { label: "Blophy 官方交流群", name: "Blophy 官方交流群", number: "761741595", description: "交流游戏与谱面" }
    ]
  },
  resources: [
    { name: "MDN Web Docs", category: "开发文档", description: "Web 标准与浏览器 API 参考。", url: "https://developer.mozilla.org/", mark: "M", color: "mint" },
    { name: "TypeScript", category: "开发文档", description: "类型系统、手册与语言参考。", url: "https://www.typescriptlang.org/docs/", mark: "TS", color: "blue" },
    { name: "React", category: "开发文档", description: "React 官方文档与学习指南。", url: "https://react.dev/", mark: "R", color: "cyan" },
    { name: "GitHub Docs", category: "开发文档", description: "GitHub 工作流、Actions 与 Pages 文档。", url: "https://docs.github.com/", mark: "GH", color: "ink" },
    { name: "Vite", category: "开发文档", description: "前端工具链和配置参考。", url: "https://vite.dev/guide/", mark: "V", color: "yellow" },
    { name: "Can I use", category: "开发文档", description: "查询浏览器对 Web 特性的支持情况。", url: "https://caniuse.com/", mark: "CI", color: "coral" },
    { name: "Figma Community", category: "设计与灵感", description: "社区文件、界面灵感与设计资源。", url: "https://www.figma.com/community", mark: "F", color: "violet" },
    { name: "Unsplash", category: "设计与灵感", description: "可用于个人项目的摄影图片资源。", url: "https://unsplash.com/", mark: "U", color: "ink" },
    { name: "Google Fonts", category: "设计与灵感", description: "开源字体目录与网页字体服务。", url: "https://fonts.google.com/", mark: "G", color: "blue" },
    { name: "Lucide", category: "设计与灵感", description: "简洁统一的开源图标集。", url: "https://lucide.dev/", mark: "L", color: "orange" },
    { name: "JSON Formatter", category: "效率工具", description: "格式化、校验与查看 JSON 数据。", url: "https://jsonformatter.org/", mark: "{}", color: "mint" },
    { name: "Regex101", category: "效率工具", description: "编写和调试正则表达式。", url: "https://regex101.com/", mark: "/", color: "coral" }
  ],
  projects: [
    {
      id: "site-archive",
      name: "个人档案站",
      kind: "个人项目",
      status: "持续维护",
      year: "2026",
      summary: "将个人介绍、常用资源、项目记录和 Wiki 收在一个轻量的静态站点里。",
      tags: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
      role: "设计与开发",
      outcome: "一个无需构建工具、可直接发布到 GitHub Pages 的个人知识入口。",
      pages: [
        { id: "overview", title: "项目概览", section: "01", body: ["这是一个纯静态的个人档案站点，包含个人介绍、资源索引、项目目录与 Wiki 页面。", "页面使用原生 HTML、CSS 和 JavaScript 构建，不依赖后端服务；内容集中在 content.js，方便日常维护。"] },
        { id: "structure", title: "内容结构", section: "02", body: ["个人介绍集中维护在 profile 对象中。常用资源由名称、分类、简介、链接和色标组成。", "项目条目支持简介、参与角色、成果、技术标签，以及各自的 Wiki 子页面。"] },
        { id: "maintenance", title: "维护记录", section: "03", body: ["添加项目时，在 projects 数组中增加一个条目，并为需要记录的主题添加 Wiki 页面。", "资源可以用页面上方的搜索框查找，也可以按分类浏览。站内页面通过地址栏中的 hash 导航。"] },
        { id: "deploy", title: "发布到 GitHub Pages", section: "04", body: ["将本目录推送到 GitHub 仓库。在仓库 Settings → Pages 中，选择从分支部署，并将目录设为根目录。", "保存后，GitHub Pages 会提供站点地址。项目仓库和个人站点仓库都可以部署；个人站点仓库通常命名为 username.github.io。"] }
      ]
    },
    {
      id: "diamond-continent-plus",
      name: "钻石大陆加豪版",
      kind: "Minecraft 整合包",
      status: "Wiki 整理中",
      year: "—",
      summary: "说明 kubejs 语言文件的翻译位置、文件结构与多语言脚本配置。",
      tags: ["Minecraft", "整合包", "汉化"],
      role: "整合包制作与资料整理",
      outcome: "把整合包相关说明整理成便于查阅的 Wiki。",
      wikiTheme: "plain",
      pages: [
        {
          id: "translation-method",
          title: "如何将整合包翻译为不同语言",
          section: "01",
          body: [
            "本页根据钻石大陆加豪版的实例文件编写。语言文件主要位于 kubejs/assets 和 kubejs/client_scripts；动手前先备份整个 kubejs 文件夹。",
            "目前本整合包的 FTB 任务部分暂时不提供兼容。通过以下方法添加的语言不会翻译或兼容 FTB 任务内容。",
            "一、kubejs/assets：可参照 Minecraft 官方 Wiki 的资源包语言文件方法。在现有模组命名空间下找到 lang 文件夹，例如 kubejs/assets/<命名空间>/lang/zh_cn.json；按同样的目录位置新增目标语言 JSON 文件，例如 en_us.json。",
            "JSON 文件使用翻译键和值的对应关系。参照 zh_cn.json 中的键名，在新文件里保留相同的键，只填写该语言对应的文本。不要翻译或改动键名，并保持 JSON 的引号、逗号和转义格式正确。不同语言代码使用小写语言与地区格式，例如 en_us、ja_jp。",
            "二、kubejs/client_scripts：这部分使用 KubeJS 脚本注册语言，不能只新增 JSON。实例中的中文脚本位于 kubejs/client_scripts/src/zh_cn/，主要文件是 zh_cn.js 和 tooltip_zh_cn.js。为新语言新建对应目录，例如 src/en_us/，分别复制这两个文件并重命名为 en_us.js 和 tooltip_en_us.js。",
            "复制脚本后，需要把文件中声明的变量名和函数名改成该语言专属的名称，并同步修改脚本内对这些名称的引用，避免与其他语言脚本重复。主翻译文件和提示文字文件都要检查；如果新增多种语言，每种语言都使用各自独有的名称。不要改动翻译键、物品 ID、占位符或脚本功能逻辑。",
            "打开两个新脚本，在文件底部找到 ClientEvents.lang('zh_cn', e => {，将 zh_cn 改为目标语言简称。例如英文使用 ClientEvents.lang('en_us', e => {，日文使用 ClientEvents.lang('ja_jp', e => {。两个脚本都要修改注册语言代码；文件名、目录名和注册代码应保持一致。",
            "完成后，在启动器里将游戏语言切换到目标语言，检查 kubejs/assets 与 kubejs/client_scripts 添加的文本。若文本没有变化，核对语言代码、目录层级和 ClientEvents.lang 注册项；若启动时报脚本错误，恢复备份并检查变量名引用及语法。"
          ]
        }
      ]
    }
  ],
  participations: [],
  gallery: {
    title: "个人图库",
    description: "收好一路收藏的灵感与约稿。每一幅作品都来自画师的创作，感谢相遇。",
    rightsNotice: "所有稿件均禁止投喂 AI。未经许可，请勿转载、商用或挪作他用。",
    artworks: [
      { image: "assets/gallery/character-sheet.png", title: "个人形象设定图", artist: "鰹ノえぼシ", artistUrl: "https://www.eboshi-official.com/", alt: "哦里冻的个人形象设定图" },
      { image: "assets/gallery/choco-illustration.png", title: "一枚小兽", artist: "伊伊子哦", artistUrl: "https://huajia.163.com/main/profile/pB09n5lE?", alt: "伊伊子哦绘制的可爱小兽" },
      { image: "assets/gallery/little-beast.png", title: "中秋贺图", artist: "葉碧岚", artistUrl: "https://huajia.163.com/main/profile/grk2zqQE?", alt: "葉碧岚绘制的中秋主题贺图" },
      { image: "assets/gallery/moon-festival.png", title: "一个芝士球", artist: "芋间凉叙", artistUrl: "https://space.bilibili.com/1939969303", alt: "芋间凉叙绘制的芝士球主题插画" },
      { image: "assets/gallery/cheese-ball.png", title: "一张可爱小兽", artist: "Decol", artistUrl: "https://huajia.163.com/main/profile/MrALqa6E?", alt: "Decol绘制的可爱小兽" },
      { image: "assets/gallery/mountain-peak.jpg", title: "横插", artist: "鰹ノえぼシ", artistUrl: "https://www.eboshi-official.com/", alt: "鰹ノえぼシ绘制的横版插画" }
    ]
  }
};
