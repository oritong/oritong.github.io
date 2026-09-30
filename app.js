(() => {
  'use strict';
  const data = window.SITE_CONTENT;
  const core = window.SITE_CORE;
  const page = document.getElementById('page-content');
  if (!data || !core) {
    page.innerHTML = '<h1>内容暂时没有载入</h1><p>请刷新页面，或检查站点文件是否完整。</p>';
    return;
  }
  const { escapeHtml: e, pages, projectHref, wikiHref, safeUrl, segment } = core;
  const projects = core.projects(data);
  const searchIndex = core.searchIndex(data);
  const searchInput = document.getElementById('site-search');
  const searchResults = document.getElementById('search-results');
  const nav = document.getElementById('site-navigation');
  const menuToggle = document.getElementById('menu-toggle');
  const backdrop = document.getElementById('mobile-backdrop');
  const mobile = matchMedia('(max-width: 959px)');
  const navLabels = { home: '首页', profile: '关于我', projects: '项目', wiki: '项目 Wiki', resources: '常用资源', gallery: '个人图库', search: '搜索结果', 'not-found': '找不到页面' };
  const originalDescription = document.querySelector('meta[name=description]').content;
  const external = 'target="_blank" rel="noopener noreferrer"';
  let state;
  let menuOpen = false;
  let searchTimer;

  function heading(kicker, title, description = '') {
    return `<header class="page-heading"><p class="eyebrow">${e(kicker)}</p><h1 tabindex="-1">${e(title)}</h1>${description ? `<p>${e(description)}</p>` : ''}</header>`;
  }
  function sectionHeading(kicker, title, href = '', label = '') {
    return `<div class="section-heading"><div><p class="eyebrow">${e(kicker)}</p><h2>${e(title)}</h2></div>${href ? `<a class="text-link" href="${e(href)}">${e(label)} <span aria-hidden="true">↗</span></a>` : ''}</div>`;
  }
  function breadcrumbs(items) {
    return `<nav class="breadcrumbs" aria-label="面包屑"><ol><li><a href="#/home">首页</a></li>${items.map((item, i) => `<li>${item.href && i < items.length - 1 ? `<a href="${e(item.href)}">${e(item.title)}</a>` : `<span aria-current="page">${e(item.title)}</span>`}</li>`).join('')}</ol></nav>`;
  }
  function emptyState(title, description, href = '#/projects', label = '查看项目') {
    return `<section class="empty-state"><h2>${e(title)}</h2><p>${e(description)}</p><a class="text-link" href="${e(href)}">${e(label)} <span aria-hidden="true">↗</span></a></section>`;
  }
  function notFound(message = '这个地址没有对应的内容。可以返回首页，或从 Wiki 目录重新查找。') {
    return heading('迷路也没关系', '这里还没有这一页', message) + `<div class="actions"><a class="button button-primary" href="#/home">回到首页</a><a class="button" href="#/wiki">浏览 Wiki</a></div>`;
  }
  const tags = project => `<ul class="tag-list" aria-label="项目标签">${(project.tags || []).map(tag => `<li>${e(tag)}</li>`).join('')}</ul>`;
  function projectLinks(project) {
    return (project.links || []).filter(link => link.url).map(link => `<a class="button" href="${e(safeUrl(link.url))}" ${external}>${e(link.label)} <span aria-hidden="true">↗</span></a>`).join('');
  }
  function projectCard(project, level = 2) {
    return `<article class="project-card"><div class="project-card-meta"><span>${e(project.kind)}</span>${project.status ? `<span class="status">${e(project.status)}</span>` : ''}</div><h${level}><a href="${e(projectHref(project))}">${e(project.name)}</a></h${level}><p>${e(project.description || project.summary)}</p>${tags(project)}<div class="actions"><a class="button" href="${e(projectHref(project))}" aria-label="了解项目：${e(project.name)}">了解项目 <span aria-hidden="true">↗</span></a>${pages(project).length ? `<a class="text-link" href="${e(wikiHref(project))}" aria-label="阅读 ${e(project.name)} 的 Wiki">阅读 Wiki</a>` : ''}${projectLinks(project)}</div></article>`;
  }
  function pageGroups(list) {
    return list.reduce((groups, article) => {
      const category = article.category || '';
      const current = groups[groups.length - 1];
      if (!current || current.category !== category) groups.push({ category, articles: [article] });
      else current.articles.push(article);
      return groups;
    }, []);
  }
  function documentList(project) {
    return `<div class="project-document-groups">${pageGroups(pages(project)).map(group => `${group.category ? `<h3 class="project-document-category">${e(group.category)}</h3>` : ''}<ul class="project-document-list">${group.articles.map(article => `<li><a href="${e(wikiHref(project, article))}"><span>${e(article.section || '—')}</span><div>${e(article.title)}${article.status ? ` <small class="status">${e(article.status)}</small>` : ''}</div><b aria-hidden="true">↗</b></a></li>`).join('')}</ul>`).join('')}</div>`;
  }
  const socialLink = link => `<a href="${e(safeUrl(link.url))}" ${external}>${e(link.label)} <span aria-hidden="true">↗</span></a>`;
  const featuredSocials = data.profile.links.filter(link => ['Bilibili', 'GitHub', 'MC百科'].includes(link.name));

  function renderHome() {
    const selected = (data.home?.featuredProjects || []).map(id => projects.find(p => p.id === id)).filter(Boolean).slice(0, 2);
    const current = (data.home?.currentProjects || []).map(id => projects.find(p => p.id === id)).filter(Boolean);
    return `<section class="hero" aria-labelledby="home-title"><div><p class="eyebrow">初次（也许不是）见面，欢迎来玩！</p><h1 id="home-title" tabindex="-1">你好，<br>我是<span>${e(data.profile.name)}</span>。</h1><p class="hero-role">${e(data.profile.role)}</p><p class="hero-intro">${e(data.profile.intro)}</p><div class="actions"><a class="button button-primary" href="#/profile">多认识我一点 <span aria-hidden="true">↗</span></a><a class="text-link" href="#/projects">看看我的项目</a></div></div><aside class="hero-aside" aria-label="一点关于我"><img class="hero-avatar" src="${e(data.profile.avatar)}" alt="${e(data.profile.name)}的头像" width="192" height="192" draggable="false"><p>${e(data.profile.introduction[2] || '')}</p><small>ORITONG / PERSONAL SPACE</small></aside></section>
    <section class="home-section now-layout" aria-labelledby="now-title"><div><p class="eyebrow">慢慢做，慢慢记录</p><h2 id="now-title">这段时间</h2><p class="now-intro">正在维护的项目，和逐渐补齐的说明。</p></div><ul class="now-list">${current.map(project => `<li><a href="${e(projectHref(project))}"><span><strong>${e(project.name)}</strong><small>${e(project.role)}</small></span><span class="status">${e(project.status)}</span></a></li>`).join('')}</ul></section>
    <section class="home-section">${sectionHeading('从这里开始看看', '我的项目', '#/projects', '查看全部项目')}<div class="${selected.length === 1 ? 'featured-layout' : 'project-grid'}">${selected.map(project => projectCard(project, 3)).join('')}</div></section>
    <section class="home-section"><div class="wiki-door"><div><p class="eyebrow">项目旁边的笔记本</p><h2>Project Wiki</h2><p>项目资料、技术说明和整理中的游玩流程，都收在这里。</p></div><a class="text-link" href="#/wiki">翻开 Wiki <span aria-hidden="true">↗</span></a></div></section>
    <section class="home-section">${sectionHeading('还有一些喜欢的东西', '随处逛逛')}<div class="shelf-grid"><a class="shelf-link" href="#/gallery"><h3>个人图库</h3><p>${e(data.gallery.description)}</p><span>去图库看看 ↗</span></a><a class="shelf-link" href="#/resources"><h3>常用资源</h3><p>开发文档、设计灵感，以及平时会用到的小工具。</p><span>打开资源目录 ↗</span></a></div><div class="social-inline" aria-label="在其他地方找到我">${featuredSocials.map(socialLink).join('')}<a href="#/profile">更多主页与社群 ↗</a></div></section>`;
  }
  function renderProjects() {
    return heading('一些正在生长的想法', '项目与创作', '做过的、参与的，还有正在整理的。感兴趣的话，可以先看看项目，再读读它的 Wiki。') + (projects.length ? `<div class="project-grid">${projects.map(project => projectCard(project)).join('')}</div>` : emptyState('项目还在整理中', '新的项目记录会出现在这里。', '#/home', '回到首页'));
  }
  function renderProject(project) {
    return breadcrumbs([{ title: '项目', href: '#/projects' }, { title: project.name }]) + heading(project.kind, project.name, project.description || project.summary) + `<div class="project-detail-layout"><section><h2>关于这个项目</h2><p class="project-description">${e(project.summary)}</p><div class="actions" style="margin-top:var(--space-6)">${pages(project).length ? `<a class="button button-primary" href="${e(wikiHref(project))}">进入项目 Wiki <span aria-hidden="true">↗</span></a>` : ''}${projectLinks(project)}</div><section class="home-section"><h2>项目笔记</h2><p class="project-description">${pages(project).length ? '按需要挑一篇，继续了解项目。' : '这个项目暂时没有公开的 Wiki，已有介绍会保留在这里。'}</p>${documentList(project)}</section></section><aside><dl class="project-facts">${project.status ? `<dt>目前状态</dt><dd>${e(project.status)}</dd>` : ''}${project.role ? `<dt>我的角色</dt><dd>${e(project.role)}</dd>` : ''}${project.outcome ? `<dt>记录与成果</dt><dd>${e(project.outcome)}</dd>` : ''}${project.year && project.year !== '—' ? `<dt>记录年份</dt><dd>${e(project.year)}</dd>` : ''}</dl><div style="margin-top:var(--space-6)">${tags(project)}</div></aside></div>`;
  }
  function renderWikiIndex() {
    const documented = projects.filter(project => pages(project).length);
    return heading('项目旁边的笔记本', '项目 Wiki', '按项目整理的资料与说明。选一份笔记，慢慢往下读。') + (documented.length ? `<div class="project-grid">${documented.map(project => `<section class="wiki-index-card"><p class="eyebrow">${e(project.kind)} · ${pages(project).length} 篇文档</p><h2>${e(project.name)}</h2><p>${e(project.summary)}</p>${documentList(project)}<a class="text-link" href="${e(projectHref(project))}">先了解这个项目 ↗</a></section>`).join('')}</div>` : emptyState('笔记还在整理中', '可以先从项目介绍开始了解。'));
  }

  function inline(text) {
    return e(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
  function renderBlock(block, index) {
    const id = e(block.id || `section-${index + 1}`);
    if (block.type === 'heading') return `<h2 id="${id}" tabindex="-1">${e(block.text)}</h2>`;
    if (block.type === 'subheading') return `<h3 id="${id}" tabindex="-1">${e(block.text)}</h3>`;
    if (block.type === 'callout') return `<aside class="wiki-callout"><strong>${e(block.title || '注意')}</strong><p>${inline(block.text)}</p></aside>`;
    if (block.type === 'code') return `<div class="code-block"><div><span>${e(block.caption || block.language || '代码')}</span><button type="button" data-copy-code="code-${index}" aria-label="复制此段代码">复制</button></div><pre tabindex="0" aria-label="${e(block.caption || '代码片段')}"><code id="code-${index}">${e(block.text)}</code></pre></div>`;
    if (block.type === 'list') { const tag = block.ordered ? 'ol' : 'ul'; return `<${tag}>${(block.items || []).map(item => `<li>${inline(item)}</li>`).join('')}</${tag}>`; }
    if (block.type === 'table') return `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(block.caption || '资料表格')}"><table>${block.caption ? `<caption>${e(block.caption)}</caption>` : ''}<thead><tr>${(block.headers || []).map(text => `<th scope="col">${e(text)}</th>`).join('')}</tr></thead><tbody>${(block.rows || []).map(row => `<tr>${row.map(text => `<td>${inline(text)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<p>${inline(block.text || '')}</p>`;
  }
  function renderWiki(project, article) {
    const blocks = core.articleBlocks(article);
    const headings = blocks.map((block, index) => ({ ...block, anchor: block.id || `section-${index + 1}` })).filter(block => block.type === 'heading');
    const list = pages(project);
    const index = list.indexOf(article);
    const previous = list[index - 1];
    const next = list[index + 1];
    const directory = pageGroups(list).map(group => `${group.category ? `<p class="wiki-directory-category">${e(group.category)}</p>` : ''}${group.articles.map(item => `<a class="wiki-link" href="${e(wikiHref(project, item))}" ${item.id === article.id ? 'aria-current="page"' : ''}><span>${e(item.section || '—')}</span>${e(item.title)}</a>`).join('')}`).join('');
    const crumbs = [{ title: 'Wiki', href: '#/wiki' }, { title: project.name, href: projectHref(project) }, ...(article.category ? [{ title: article.category }] : []), { title: article.title }];
    return breadcrumbs(crumbs) + `<div class="wiki-layout"><aside class="wiki-sidebar"><h2>${e(project.name)}</h2><p>${e(project.kind)}</p><details id="wiki-directory" ${mobile.matches ? '' : 'open'}><summary>项目目录 · ${list.length} 篇</summary><nav aria-label="${e(project.name)}文档目录">${directory}</nav></details><a class="text-link" href="${e(projectHref(project))}">← 项目介绍</a></aside><article class="wiki-article"><header><div class="article-meta"><span>${e(article.category || '项目笔记')} / ${e(article.section || '')}</span>${article.status ? `<span class="status">${e(article.status)}</span>` : ''}${article.version ? `<span>适用版本 ${e(article.version)}</span>` : ''}${article.updatedAt ? `<span>更新于 <time datetime="${e(article.updatedAt)}">${e(article.updatedAt)}</time></span>` : ''}</div><h1 tabindex="-1">${e(article.title)}</h1><p class="article-deck">${e(article.description || project.summary)}</p></header>${headings.length > 1 ? `<details class="article-toc" open><summary>这篇笔记里</summary><nav aria-label="本文目录"><ul>${headings.map(h => `<li><a data-section="${e(h.anchor)}" href="${e(wikiHref(project, article))}?section=${segment(h.anchor)}">${e(h.text)}</a></li>`).join('')}</ul></nav></details>` : ''}<div class="article-body">${blocks.map(renderBlock).join('')}</div>${article.id === 'overview' ? `<dl class="project-facts" style="margin-top:var(--space-8)"><dt>我的角色</dt><dd>${e(project.role || '尚未填写')}</dd><dt>记录与成果</dt><dd>${e(project.outcome || '尚未填写')}</dd></dl>` : ''}${previous || next ? `<nav class="article-pagination" aria-label="相邻文章">${previous ? `<a href="${e(wikiHref(project, previous))}" data-direction="previous"><small>← 上一篇</small>${e(previous.title)}</a>` : ''}${next ? `<a href="${e(wikiHref(project, next))}" data-direction="next"><small>下一篇 →</small>${e(next.title)}</a>` : ''}</nav>` : ''}<p class="copy-status" id="copy-status" role="status"></p></article></div>`;
  }
  function renderProfile() {
    return heading('多认识我一点', `关于${data.profile.name}`, '在方块世界里搭建故事，也为旋律写下新的旅程。') + `<div class="profile-layout"><aside><div class="profile-photo"><img src="${e(data.profile.avatar)}" alt="${e(data.profile.name)}的头像" width="240" height="240" draggable="false"></div><p class="list-note">${e(data.profile.handle)}</p></aside><div><div class="profile-story">${data.profile.introduction.map(text => `<p>${e(text)}</p>`).join('')}</div><div class="profile-roles"><div><small>创作身份</small><strong>Minecraft 整合包制作者</strong><small>把喜欢的元素收进一段新的冒险</small></div><div><small>音乐创作</small><strong>《Blophy》官方谱师</strong><small>把旋律写成可以亲手游玩的节奏</small></div></div><a class="text-link" style="margin-top:var(--space-6)" href="#/gallery">来个人图库逛逛 ↗</a></div></div><section class="profile-socials"><h2>在这些地方找到我</h2><div class="social-links">${data.profile.links.map(link => `<a class="social-link" href="${e(safeUrl(link.url))}" ${external}><span class="social-mark" aria-hidden="true">${e(link.mark)}</span><span class="social-copy"><strong>${e(link.label)}</strong><small>${e(link.description)}</small></span><span class="social-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><div class="group-links">${data.profile.groups.map(group => `<div class="group-link"><div><strong>${e(group.name)}</strong><small>${e(group.description)}</small></div><button type="button" class="group-copy-button" data-copy-group="${e(group.number)}" aria-label="复制${e(group.name)}群号 ${e(group.number)}"><span>${e(group.number)}</span><b>复制</b></button></div>`).join('')}</div><p class="copy-status" id="copy-status" role="status"></p></section><section class="home-section"><h2>还有一句话</h2><p class="project-description">如果你喜欢这些作品，欢迎支持创作，也欢迎把喜欢的那一瞬分享给我。</p></section>`;
  }
  function resourceCard(item) {
    const index = data.resources.indexOf(item);
    return `<a id="resource-${index + 1}" class="resource-row" href="${e(safeUrl(item.url))}" ${external}><span class="resource-mark" aria-hidden="true">${e(item.mark)}</span><span class="resource-copy"><span class="resource-category">${e(item.category)}</span><strong>${e(item.name)}</strong>${item.description ? `<small>${e(item.description)}</small>` : ''}</span><span class="external-arrow" aria-hidden="true">↗</span></a>`;
  }
  function renderResources() {
    const categories = ['全部', ...new Set(data.resources.map(item => item.category))];
    const category = categories.includes(state.category) ? state.category : '全部';
    const items = category === '全部' ? data.resources : data.resources.filter(item => item.category === category);
    return heading('收藏夹的一角', '常用资源', `${data.resources.length} 个书签，按需要慢慢翻。`) + `<div class="filter-bar" role="group" aria-label="资源分类">${categories.map(name => `<button class="filter-button" type="button" data-filter="${e(name)}" aria-pressed="${name === category}">${e(name)}<span>${name === '全部' ? data.resources.length : data.resources.filter(item => item.category === name).length}</span></button>`).join('')}</div><div class="resource-list" id="resource-list">${items.map(resourceCard).join('')}</div><p id="filter-status" class="sr-only" role="status"></p><p class="list-note">资源链接在新标签页打开 ↗</p>`;
  }
  function renderGallery() {
    const gallery = data.gallery;
    return heading('喜欢的瞬间，好好收藏', gallery.title, gallery.description) + `<aside class="gallery-notice"><strong>请尊重画师与创作者</strong><p>${e(gallery.rightsNotice)}</p></aside>${gallery.artworks.length ? `<div class="gallery-grid">${gallery.artworks.map((artwork, i) => `<figure class="gallery-artwork" id="artwork-${i + 1}" tabindex="-1"><div class="gallery-image-frame"><img src="${e(artwork.image)}" alt="${e(artwork.alt || artwork.title || '个人收藏稿件')}" loading="lazy" decoding="async" draggable="false"><span class="gallery-image-mark">${e(gallery.rightsNotice.split('。')[0])}</span></div><figcaption><div><strong>${e(artwork.title || '收藏稿件')}</strong><small>${artwork.artistUrl ? `<a class="gallery-artist-link" href="${e(safeUrl(artwork.artistUrl))}" ${external}>画师 · ${e(artwork.artist)} ↗</a>` : e(artwork.artist || '个人约稿')}</small></div>${artwork.date ? `<small>${e(artwork.date)}</small>` : ''}</figcaption>${artwork.note ? `<p class="gallery-caption-note">${e(artwork.note)}</p>` : ''}</figure>`).join('')}</div>` : emptyState('喜欢的瞬间，值得好好收藏', '约稿整理中，新的作品会在这里和你见面。', '#/profile', '关于我')}`;
  }
  function renderSearch(query) {
    const results = core.search(searchIndex, query);
    return heading('在这里找一找', query ? `“${query}” 的搜索结果` : '搜索个人空间', query ? `找到 ${results.length} 条相关记录` : '在页头输入项目、资源、画师或 Wiki 中的关键词。') + (results.length ? `<div class="search-page-results">${results.map(item => `<a class="search-page-row" href="${e(item.href)}"><span>${e(item.type)}</span><div><strong>${e(item.title)}</strong><small>${e(item.summary.length > 150 ? item.summary.slice(0, 150) + '…' : item.summary)}</small></div><b aria-hidden="true">↗</b></a>`).join('')}</div>` : emptyState(query ? '还没找到相关内容' : '从一个关键词开始', '可以试试“Minecraft”“翻译”或“资源”。', '#/wiki', '浏览 Wiki 目录'));
  }

  function closeSearch() { searchResults.hidden = true; searchInput.setAttribute('aria-expanded', 'false'); }
  function updateSearch() {
    const query = searchInput.value.trim();
    clearTimeout(searchTimer);
    if (!query) { closeSearch(); searchResults.innerHTML = ''; return; }
    const matches = core.search(searchIndex, query);
    searchResults.innerHTML = `<div class="search-result-caption"><span>找到 ${matches.length} 条记录</span><span>↑ ↓ 选择 · Enter 打开</span></div>${matches.slice(0, 7).map(item => `<a class="search-result-row" href="${e(item.href)}"><span>${e(item.type)}</span><strong>${e(item.title)}</strong><small>${e(item.summary)}</small></a>`).join('')}${matches.length ? '' : '<p>没有找到相关内容，换个词试试。</p>'}<a class="search-all" href="#/search/${segment(query)}">查看全部结果 <span aria-hidden="true">↗</span></a>`;
    searchResults.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
    searchTimer = setTimeout(() => { document.getElementById('search-status').textContent = `找到 ${matches.length} 条记录，按向下键浏览建议。`; }, 250);
  }
  function setMenu(open, restoreFocus = false) {
    menuOpen = open && mobile.matches;
    nav.classList.toggle('open', menuOpen);
    nav.inert = mobile.matches && !menuOpen;
    menuToggle.setAttribute('aria-expanded', String(menuOpen));
    menuToggle.setAttribute('aria-label', menuOpen ? '关闭导航菜单' : '打开导航菜单');
    backdrop.hidden = !menuOpen;
    document.body.classList.toggle('menu-open', menuOpen);
    for (const element of [page, document.querySelector('.site-footer'), document.getElementById('search-area'), document.querySelector('.wordmark')]) element.inert = menuOpen;
    if (menuOpen) { closeSearch(); nav.querySelector('a').focus(); }
    else if (restoreFocus) menuToggle.focus();
  }
  function focusTarget(target, scroll = true) {
    if (!target) return;
    if (!target.matches('a[href],button,input,select,textarea,summary,[tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (scroll) target.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function render(event) {
    state = core.parseRoute(location.hash);
    let title = navLabels[state.route] || '找不到页面';
    let description = originalDescription;
    let html;
    if (state.route === 'home') html = renderHome();
    else if (state.route === 'profile') html = renderProfile();
    else if (state.route === 'projects') {
      if (!state.projectId) html = renderProjects();
      else { const project = projects.find(item => item.id === state.projectId); html = project ? renderProject(project) : notFound('没有找到这个项目，请返回项目目录。'); title = project?.name || '找不到项目'; description = project?.description || project?.summary || originalDescription; }
    } else if (state.route === 'wiki') {
      if (!state.projectId) html = renderWikiIndex();
      else {
        const resolved = core.resolveWiki(data, state);
        if (resolved.error) { html = notFound(resolved.error === 'article' ? '这个项目还没有对应的文档，请从 Wiki 目录重新选择。' : '没有找到这个项目的 Wiki。'); title = '找不到文档'; }
        else if (resolved.empty) { title = `${resolved.project.name} · Wiki`; html = heading('项目笔记', title) + emptyState('这里的笔记还在整理中', '项目介绍仍然可以正常阅读。', projectHref(resolved.project), '查看项目介绍'); }
        else {
          html = renderWiki(resolved.project, resolved.current); title = `${resolved.current.title} · ${resolved.project.name}`; description = resolved.current.description || resolved.project.summary;
          const canonical = resolved.canonical + (state.section ? `?section=${segment(state.section)}` : '');
          if (location.hash !== canonical) history.replaceState(null, '', canonical);
        }
      }
    } else if (state.route === 'resources') html = renderResources();
    else if (state.route === 'gallery') html = renderGallery();
    else if (state.route === 'search') { html = renderSearch(state.query); title = state.query ? `搜索：${state.query}` : title; }
    else html = notFound(state.malformed ? '地址中的文字编码不完整。可以重新搜索，或返回首页。' : undefined);
    closeSearch(); setMenu(false);
    page.classList.toggle('is-wiki', state.route === 'wiki' && Boolean(state.projectId));
    page.innerHTML = html;
    document.title = `${title} · 哦里冻 Oritong`;
    document.querySelector('meta[name=description]').content = description;
    document.querySelectorAll('[data-route]').forEach(link => { if (link.dataset.route === state.route) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    document.getElementById('route-status').textContent = title;
    const targetId = state.section || (['resources', 'gallery'].includes(state.route) ? state.itemId : '');
    const target = targetId ? document.getElementById(targetId) : null;
    if (target && page.contains(target)) { target.classList.add('target-highlight'); requestAnimationFrame(() => focusTarget(target)); }
    else { window.scrollTo(0, 0); if (event) focusTarget(page.querySelector('h1'), false); }
  }
  async function copyText(text, button, success) {
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; }
    catch {
      const field = document.createElement('textarea'); field.value = text; field.readOnly = true; field.className = 'sr-only'; document.body.append(field); field.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      field.remove(); button.focus({ preventScroll: true });
    }
    const label = button.querySelector('b') || button; label.textContent = copied ? '已复制' : '复制';
    const status = document.getElementById('copy-status'); if (status) status.textContent = copied ? success : `复制未成功，请手动选择：${text}`;
  }

  menuToggle.addEventListener('click', () => setMenu(!menuOpen, menuOpen));
  document.getElementById('menu-close').addEventListener('click', () => setMenu(false, true));
  backdrop.addEventListener('click', () => setMenu(false, true));
  mobile.addEventListener('change', () => { setMenu(false); const directory = document.getElementById('wiki-directory'); if (directory) directory.open = !mobile.matches; });
  searchInput.addEventListener('input', updateSearch);
  searchInput.addEventListener('focus', updateSearch);
  searchInput.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Enter' && searchInput.value.trim()) { event.preventDefault(); location.hash = `/search/${segment(searchInput.value.trim())}`; closeSearch(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { if (searchResults.hidden) updateSearch(); const links = searchResults.querySelectorAll('a'); if (links.length) { event.preventDefault(); links[event.key === 'ArrowDown' ? 0 : links.length - 1].focus(); } }
    if (event.key === 'Escape') { event.preventDefault(); closeSearch(); searchInput.blur(); }
  });
  searchResults.addEventListener('keydown', event => {
    const links = [...searchResults.querySelectorAll('a')]; const index = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); links[(index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus(); }
    if (event.key === 'Escape') { searchInput.focus(); closeSearch(); }
  });
  document.getElementById('search-area').addEventListener('focusout', () => { setTimeout(() => { if (!document.getElementById('search-area').contains(document.activeElement)) closeSearch(); }, 0); });
  document.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (menuOpen) {
      if (event.key === 'Escape') { event.preventDefault(); setMenu(false, true); }
      if (event.key === 'Tab') { const controls = [menuToggle, ...nav.querySelectorAll('a,button')]; const index = controls.indexOf(document.activeElement); if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1).focus(); } else if (!event.shiftKey && index === controls.length - 1) { event.preventDefault(); controls[0].focus(); } }
      return;
    }
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !document.activeElement.matches('input,textarea,select,[contenteditable]')) { event.preventDefault(); searchInput.focus(); }
  });
  document.addEventListener('click', event => {
    const target = event.target.closest ? event.target : event.target.parentElement;
    if (target.closest('.skip-link')) { event.preventDefault(); focusTarget(page); return; }
    if (!target.closest('#search-area')) closeSearch();
    const filter = target.closest('[data-filter]');
    if (filter) {
      const category = filter.dataset.filter; const items = category === '全部' ? data.resources : data.resources.filter(item => item.category === category);
      document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button === filter)));
      document.getElementById('resource-list').innerHTML = items.map(resourceCard).join('');
      document.getElementById('filter-status').textContent = `${category}，${items.length} 个资源`;
      history.replaceState(null, '', category === '全部' ? '#/resources' : `#/resources?category=${segment(category)}`);
    }
    const group = target.closest('[data-copy-group]'); if (group) copyText(group.dataset.copyGroup, group, `已复制群号 ${group.dataset.copyGroup}`);
    const codeButton = target.closest('[data-copy-code]'); if (codeButton) copyText(document.getElementById(codeButton.dataset.copyCode).textContent, codeButton, '代码已复制');
    const link = target.closest('a[href]');
    if (link?.getAttribute('href') === location.hash) {
      if (menuOpen) { setMenu(false); focusTarget(page.querySelector('h1'), false); }
      if (link.dataset.section) { event.preventDefault(); focusTarget(document.getElementById(link.dataset.section)); }
    }
  });
  for (const name of ['contextmenu', 'dragstart']) document.addEventListener(name, event => { if (event.target.closest?.('.gallery-image-frame')) event.preventDefault(); });
  window.addEventListener('hashchange', render);
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  document.getElementById('footer-about').innerHTML = `<a href="#/home"><strong>${e(data.profile.name)} / Oritong</strong></a><p>${e(data.profile.role)}</p><p>一个持续整理中的个人空间。</p>`;
  document.getElementById('footer-socials').innerHTML = featuredSocials.map(socialLink).join('') + '<a href="#/profile">所有主页与社群 ↗</a>';
  setMenu(false); render();
})();
