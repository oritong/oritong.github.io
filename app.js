(() => {
  const data = window.SITE_CONTENT;
  const page = document.getElementById("page-content");
  const currentSection = document.getElementById("current-section");
  const searchInput = document.getElementById("site-search");
  const searchResults = document.getElementById("search-results");
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menu-toggle");
  const backdrop = document.getElementById("mobile-backdrop");
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const hrefFor = (route) => `#/${route}`;
  const navLabels = { home: "概览", profile: "个人介绍", resources: "常用资源", projects: "参与项目", wiki: "项目 Wiki", gallery: "个人图库" };

  function locationState() {
    const parts = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/").filter(Boolean);
    return { route: parts[0] || "home", projectId: parts[1] || data.projects[0]?.id, pageId: parts[2] || "overview", query: parts[0] === "search" ? parts.slice(1).join("/") : "" };
  }

  function resourceCard(item, index) {
    return `<a class="resource-row" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
      <span class="resource-mark ${escapeHtml(item.color)}">${escapeHtml(item.mark)}</span>
      <span class="resource-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></span>
      <span class="resource-category">${escapeHtml(item.category)}</span><span class="external-arrow" aria-hidden="true">↗</span>
    </a>`;
  }

  function projectCard(project, participation = false) {
    return `<article class="project-row">
      <div class="project-index">${escapeHtml(project.year || "—")}</div>
      <div class="project-main"><div class="project-title-line"><h3>${escapeHtml(project.name)}</h3><span class="status"><i></i>${escapeHtml(project.status || "进行中")}</span></div>
        <p>${escapeHtml(project.summary)}</p><div class="tag-list">${(project.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div></div>
      <a class="project-open" href="${hrefFor(`wiki/${project.id}/overview`)}" aria-label="打开 ${escapeHtml(project.name)} 的 Wiki">↗</a>
    </article>`;
  }

  function emptyState(title, description) {
    return `<div class="empty-state"><div class="empty-mark">+</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p><a href="${hrefFor("wiki/site-archive/structure")}">查看内容结构 <span>↗</span></a></div>`;
  }

  function sectionHeading(kicker, title, description = "") {
    return `<div class="section-heading"><div><p class="eyebrow">${escapeHtml(kicker)}</p><h1>${escapeHtml(title)}</h1></div>${description ? `<p class="section-description">${escapeHtml(description)}</p>` : ""}</div>`;
  }

  function renderHome() {
    const project = data.projects[0];
    return `<section class="cover" aria-label="个人档案封面">
        <div class="cover-shade"></div>
        <div class="celestial-art" aria-hidden="true"><div class="celestial-orbit orbit-outer"><i></i></div><div class="celestial-orbit orbit-inner"><i></i></div><div class="celestial-core"></div><span class="celestial-spark">✦</span></div>
        <div class="cover-meta"><span>✦ PERSONAL UNIVERSE</span><span>EST. 2026</span></div>
        <div class="cover-title"><p>你好，欢迎来到</p><h1>${escapeHtml(data.profile.name)}的个人网站！</h1><div class="cover-bottom"><span>${escapeHtml(data.profile.role)}</span><span>01 — 06</span></div></div>
      </section>
      <section class="overview-intro">
        <div class="intro-statement"><p class="eyebrow">这段时间</p><h2>${escapeHtml(data.profile.intro)}</h2><a class="text-link" href="${hrefFor("profile")}">认识我 <span>↗</span></a></div>
        <div class="overview-facts"><div><span>项目档案</span><strong>${String(data.projects.length + data.participations.length).padStart(2, "0")}</strong></div><div><span>资源收录</span><strong>${String(data.resources.length).padStart(2, "0")}</strong></div><div><span>Wiki 章节</span><strong>${String(data.projects.reduce((sum, item) => sum + item.pages.length, 0)).padStart(2, "0")}</strong></div></div>
      </section>
      <section class="home-columns">
        <div class="home-projects"><div class="section-bar"><div><p class="eyebrow">SELECTED WORK</p><h2>最近的项目</h2></div><a class="text-link" href="${hrefFor("projects")}">全部项目 <span>↗</span></a></div>
          ${project ? projectCard(project) : emptyState("还没有项目", "项目记录将在这里显示。")}
        </div>
        <div class="home-resources"><div class="section-bar"><div><p class="eyebrow">BOOKMARKS</p><h2>常用资源</h2></div><a class="text-link" href="${hrefFor("resources")}">资源目录 <span>↗</span></a></div>
          ${data.resources.slice(0, 4).map(resourceCard).join("")}
        </div>
      </section>`;
  }

  function renderProfile() {
    return `${sectionHeading("PROFILE / 02", "关于哦里冻", "在方块世界里搭建故事，也为旋律写下新的旅程。")}
      <section class="profile-layout"><div class="profile-photo"><img src="${escapeHtml(data.profile.avatar)}" alt="${escapeHtml(data.profile.name)} 的头像" draggable="false" /><span>${escapeHtml(data.profile.handle)}<br/>PERSONAL ARCHIVE</span></div>
        <div class="profile-content"><p class="eyebrow">A LITTLE ABOUT ME</p><h2>你好，我是<br/><strong>${escapeHtml(data.profile.name)}！</strong></h2>
          <div class="profile-story">${data.profile.introduction.map((paragraph, index) => `<p class="${index === data.profile.introduction.length - 1 ? "story-invitation" : ""}">${escapeHtml(paragraph)}</p>`).join("")}</div>
          <div class="profile-roles"><div><span>创作身份</span><strong>Minecraft 整合包制作者</strong><small>把喜欢的元素收进一段新的冒险</small></div><div><span>音乐创作</span><strong>《Blophy》官方谱师</strong><small>把旋律写成可以亲手游玩的节奏</small></div></div>
          <section class="profile-socials"><div class="socials-heading"><div><p class="eyebrow">FIND ME AROUND</p><h3>我的主页与社群</h3></div><span>LINKS / 10</span></div>
            <div class="social-links">${data.profile.links.map(link => `<a class="social-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer"><span class="social-mark">${escapeHtml(link.mark)}</span><span class="social-copy"><strong>${escapeHtml(link.label)}</strong><small>${escapeHtml(link.description)}</small></span><span class="social-arrow" aria-hidden="true">↗</span></a>`).join("")}</div>
            <div class="group-links">${data.profile.groups.map(group => `<div class="group-link"><span class="group-mark" aria-hidden="true">Q</span><span class="group-copy"><strong>${escapeHtml(group.name)}</strong><small>${escapeHtml(group.description)}</small></span><button type="button" class="group-copy-button" data-copy-group="${escapeHtml(group.number)}" aria-label="复制${escapeHtml(group.name)}群号 ${escapeHtml(group.number)}" title="复制群号"><span>${escapeHtml(group.number)}</span><b aria-hidden="true">复制</b></button></div>`).join("")}</div>
            <p class="copy-status" id="copy-status" aria-live="polite" role="status"></p>
          </section>
          <a class="profile-gallery-link" href="${hrefFor("gallery")}"><span><small>MY COMMISSION ARCHIVE</small><strong>来个人图库逛逛</strong></span><b>↗</b></a>
        </div>
      </section>
      <section class="profile-footnote"><span>ONE MORE THING</span><p>如果你喜欢这些作品，欢迎支持创作，也欢迎把喜欢的那一瞬分享给我。</p></section>`;
  }

  function renderGallery() {
    const gallery = data.gallery;
    const items = gallery.artworks || [];
    return `${sectionHeading("ARTWORKS / 06", gallery.title, gallery.description)}
      <section class="gallery-notice"><span class="notice-icon">✳</span><p><strong>请尊重画师与创作者</strong><br/>${escapeHtml(gallery.rightsNotice)}</p><span class="notice-stamp">NO AI<br/>TRAINING</span></section>
      ${items.length ? `<div class="gallery-grid">${items.map((artwork, index) => `<figure class="gallery-artwork"><div class="gallery-image-frame"><img src="${escapeHtml(artwork.image)}" alt="${escapeHtml(artwork.alt || artwork.title || "个人收藏稿件")}" loading="lazy" draggable="false" /><span class="gallery-image-mark">✦ ${escapeHtml(gallery.rightsNotice.split("。")[0])}</span></div><figcaption><div><strong>${escapeHtml(artwork.title || `收藏稿件 ${String(index + 1).padStart(2, "0")}`)}</strong><small>${artwork.artistUrl ? `<a class="gallery-artist-link" href="${escapeHtml(artwork.artistUrl)}" target="_blank" rel="noopener noreferrer" title="访问 ${escapeHtml(artwork.artist)} 的主页">画师 · ${escapeHtml(artwork.artist)} ↗</a>` : escapeHtml(artwork.artist ? `画师 · ${artwork.artist}` : "个人约稿")}</small></div><span>${escapeHtml(artwork.date || "COMMISSIONS")}</span></figcaption>${artwork.note ? `<p class="gallery-caption-note">${escapeHtml(artwork.note)}</p>` : ""}</figure>`).join("")}</div>` : `<div class="gallery-empty"><div class="gallery-empty-art"><span class="gallery-star star-a">✦</span><span class="gallery-star star-b">✧</span><span class="gallery-empty-orbit"></span><span class="gallery-empty-core">O.</span><span class="gallery-empty-caption">A PLACE FOR<br/>LITTLE WONDERS</span></div><div><p class="eyebrow">COLLECTED WITH CARE</p><h2>喜欢的瞬间，<br/>值得好好收藏。</h2><p>约稿整理中，新的作品很快会在这里和你见面。</p></div></div>`}
      <p class="gallery-footer-note"><span>✦</span> 每一份创作都值得被好好对待 <span>✦</span></p>`;
  }

  function renderResources() {
    const categories = ["全部", ...new Set(data.resources.map(item => item.category))];
    return `${sectionHeading("LIBRARY / 03", "常用资源", `${String(data.resources.length).padStart(2, "0")} 个书签 · 持续整理`)}
      <div class="filter-bar" role="group" aria-label="资源分类">${categories.map((name, index) => `<button class="filter-button ${index === 0 ? "active" : ""}" data-filter="${escapeHtml(name)}" type="button">${escapeHtml(name)} <span>${index === 0 ? data.resources.length : data.resources.filter(item => item.category === name).length}</span></button>`).join("")}</div>
      <div class="resource-list" id="resource-list">${data.resources.map(resourceCard).join("")}</div>
      <p class="list-note">链接在新窗口打开 <span>↗</span></p>`;
  }

  function renderProjects() {
    const records = [...data.projects.map(project => ({ ...project, recordType: "个人项目" })), ...data.participations.map(project => ({ ...project, recordType: "参与项目" }))];
    return `${sectionHeading("WORK / 04", "参与项目", `${String(records.length).padStart(2, "0")} 个项目档案`)}
      <div class="project-ledger"><div class="ledger-head"><span>年份</span><span>项目 / 角色 / 记录</span><span>Wiki</span></div>
        ${records.length ? records.map(project => `<div class="project-record">${projectCard(project)}<span class="record-type">${escapeHtml(project.recordType)}</span></div>`).join("") : emptyState("项目记录待添加", "把参与的开源协作、团队项目或个人作品整理在这里。")}
      </div><p class="page-note">每条项目记录都可以附带独立的 Wiki 页面，记录背景、过程和成果。</p>`;
  }

  function renderWiki(projectId, pageId) {
    const project = data.projects.find(item => item.id === projectId) || data.projects[0];
    if (!project) return `${sectionHeading("WIKI / 05", "项目 Wiki")}${emptyState("还没有项目 Wiki", "添加项目后即可建立文档目录。")}`;
    const current = project.pages.find(item => item.id === pageId) || project.pages[0];
    const contents = current.body.map((paragraph, index) => `<p>${escapeHtml(paragraph)}</p>${index === 0 && current.id === "overview" ? `<div class="wiki-callout"><span>INDEX</span><p>${escapeHtml(project.name)}<br/><small>${escapeHtml(project.kind)} · ${escapeHtml(project.year)}</small></p></div>` : ""}`).join("");
    return `<div class="wiki-topline"><p class="eyebrow">WIKI / 05 <span>↗</span> ${escapeHtml(project.name.toUpperCase())}</p><a class="text-link" href="${hrefFor("projects")}">返回项目 <span>↗</span></a></div>
      <div class="wiki-layout${project.wikiTheme === "plain" ? " wiki-plain" : ""}"><aside class="wiki-index"><p class="wiki-index-title">${escapeHtml(project.name)}</p><span class="wiki-index-meta">${escapeHtml(project.kind)} · ${escapeHtml(project.status)}</span><div class="wiki-index-rule"></div>
        <nav aria-label="Wiki 页面目录">${project.pages.map(item => `<a class="wiki-link ${item.id === current.id ? "active" : ""}" href="${hrefFor(`wiki/${project.id}/${item.id}`)}"><span>${escapeHtml(item.section)}</span>${escapeHtml(item.title)}</a>`).join("")}</nav>
        <div class="wiki-tech"><span>技术标签</span><div class="tag-list">${project.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div></div></aside>
        <article class="wiki-article"><div class="article-meta"><span>${escapeHtml(project.year)} — ${escapeHtml(current.section)}</span><span>PROJECT NOTES</span></div><h1>${escapeHtml(current.title)}</h1><p class="article-deck">${escapeHtml(project.summary)}</p>
          <div class="article-rule"></div><div class="article-body">${contents}</div>
          ${current.id === "overview" ? `<div class="wiki-outcome"><span>我的角色</span><strong>${escapeHtml(project.role)}</strong><span>项目成果</span><p>${escapeHtml(project.outcome)}</p></div>` : ""}
          <div class="article-pagination">${project.pages.map((item, index) => `<a class="${item.id === current.id ? "current" : ""}" href="${hrefFor(`wiki/${project.id}/${item.id}`)}"><span>0${index + 1}</span>${escapeHtml(item.title)}</a>`).join("")}</div>
        </article></div>`;
  }

  function renderSearchPage(query) {
    const q = query.toLowerCase();
    const results = collectSearchItems().filter(item => item.text.toLowerCase().includes(q));
    return `${sectionHeading("SEARCH", `“${query}” 的搜索结果`, `找到 ${results.length} 条相关记录`)}<div class="search-page-results">${results.length ? results.map(item => `<a class="search-page-row" href="${item.href}"><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.summary)}</small><b>↗</b></a>`).join("") : emptyState("没有找到相关内容", "试试项目名称、资源分类或 Wiki 标题。")}</div>`;
  }

  function render() {
    const state = locationState();
    const route = state.route;
    searchResults.hidden = true;
    document.querySelectorAll("[data-route]").forEach(link => link.classList.toggle("active", link.dataset.route === route));
    currentSection.textContent = navLabels[route] || "搜索结果";
    if (route === "profile") page.innerHTML = renderProfile();
    else if (route === "resources") page.innerHTML = renderResources();
    else if (route === "projects") page.innerHTML = renderProjects();
    else if (route === "wiki") page.innerHTML = renderWiki(state.projectId, state.pageId);
    else if (route === "gallery") page.innerHTML = renderGallery();
    else if (route === "search") page.innerHTML = renderSearchPage(state.query || "");
    else page.innerHTML = renderHome();
    bindPageEvents();
    closeMenu();
    window.scrollTo(0, 0);
  }

  function bindPageEvents() {
    document.querySelectorAll(".filter-button").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll(".filter-button").forEach(item => item.classList.toggle("active", item === button));
      const filter = button.dataset.filter;
      const items = filter === "全部" ? data.resources : data.resources.filter(item => item.category === filter);
      document.getElementById("resource-list").innerHTML = items.map(resourceCard).join("");
    }));
  }

  function collectSearchItems() {
    return [
      ...data.resources.map(item => ({ type: "资源", title: item.name, summary: item.description, text: `${item.name} ${item.description} ${item.category}`, href: hrefFor("resources") })),
      ...data.projects.flatMap(project => [
        { type: "项目", title: project.name, summary: project.summary, text: `${project.name} ${project.summary} ${project.tags.join(" ")}`, href: hrefFor(`wiki/${project.id}/overview`) },
        ...project.pages.map(item => ({ type: "Wiki", title: `${project.name} · ${item.title}`, summary: item.body.join(" "), text: `${project.name} ${item.title} ${item.body.join(" ")}`, href: hrefFor(`wiki/${project.id}/${item.id}`) }))
      ]),
      { type: "介绍", title: data.profile.name, summary: data.profile.introduction.join(" "), text: `${data.profile.name} ${data.profile.introduction.join(" ")} ${data.profile.links.map(link => `${link.name} ${link.label}`).join(" ")} ${data.profile.groups.map(group => `${group.name} ${group.number}`).join(" ")}`, href: hrefFor("profile") },
      ...(data.gallery.artworks || []).map(artwork => ({ type: "图库", title: artwork.title || "收藏稿件", summary: artwork.artist || "个人约稿", text: `${artwork.title || ""} ${artwork.artist || ""} ${artwork.note || ""}`, href: hrefFor("gallery") }))
    ];
  }

  function updateSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) { searchResults.hidden = true; searchResults.innerHTML = ""; return; }
    const matches = collectSearchItems().filter(item => item.text.toLowerCase().includes(query)).slice(0, 7);
    searchResults.innerHTML = `<div class="search-result-caption">搜索档案内容 <span>${matches.length}${matches.length === 7 ? "+" : ""}</span></div>${matches.length ? matches.map(item => `<a href="${item.href}" class="search-result-row"><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.summary)}</small></a>`).join("") : `<p class="search-no-results">没有找到相关内容</p>`}<a class="search-all" href="${hrefFor(`search/${encodeURIComponent(searchInput.value.trim())}`)}">查看全部结果 <span>↗</span></a>`;
    searchResults.hidden = false;
  }

  function closeMenu() {
    sidebar.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    backdrop.hidden = true;
  }

  async function copyGroupNumber(number, button) {
    const status = document.getElementById("copy-status");
    let copied = false;
    try {
      await navigator.clipboard.writeText(number);
      copied = true;
    } catch {
      const field = document.createElement("textarea");
      field.value = number;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand("copy"); } catch { copied = false; }
      field.remove();
    }
    button.classList.toggle("copied", copied);
    button.querySelector("b").textContent = copied ? "已复制" : "复制";
    if (status) status.textContent = copied ? `已复制群号 ${number}` : `复制未成功，请手动选择群号 ${number}`;
  }

  menuToggle.addEventListener("click", () => {
    const open = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    backdrop.hidden = !open;
  });
  backdrop.addEventListener("click", closeMenu);
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-copy-group]");
    if (button) copyGroupNumber(button.dataset.copyGroup, button);
  });
  searchInput.addEventListener("input", updateSearch);
  searchInput.addEventListener("focus", updateSearch);
  searchInput.addEventListener("keydown", event => {
    if (event.key === "Escape") { searchInput.value = ""; updateSearch(); searchInput.blur(); }
    if (event.key === "Enter" && searchInput.value.trim()) location.hash = `/search/${encodeURIComponent(searchInput.value.trim())}`;
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".topbar-tools")) searchResults.hidden = true;
  });
  document.addEventListener("contextmenu", event => {
    if (event.target.closest(".gallery-artwork")) event.preventDefault();
  });
  document.addEventListener("dragstart", event => {
    if (event.target.closest(".gallery-artwork")) event.preventDefault();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { event.preventDefault(); searchInput.focus(); }
  });
  window.addEventListener("hashchange", render);
  document.getElementById("footer-year").textContent = new Date().getFullYear();
  render();
})();
