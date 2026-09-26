/* Shared, DOM-free helpers for the site and its regression tests. */
((root) => {
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const segment = value => encodeURIComponent(String(value));
  const projects = data => [...(data.projects || []), ...(data.participations || [])];
  const pages = project => Array.isArray(project?.pages) ? project.pages : [];
  const projectHref = project => `#/projects/${segment(project.id)}`;
  const wikiHref = (project, article = pages(project)[0]) => `#/wiki/${segment(project.id)}${article ? `/${segment(article.id)}` : ''}`;
  const safeUrl = value => /^(https?:[/][/]|mailto:|#[/])/i.test(value || '') ? value : '#/profile';

  function parseRoute(hash = '') {
    const raw = hash.replace(/^#[/]?/, '');
    try {
      const slash = raw.indexOf('/');
      if ((slash === -1 ? raw : raw.slice(0, slash)) === 'search') {
        return { route: 'search', query: decodeURIComponent(slash < 0 ? '' : raw.slice(slash + 1)) };
      }
      const [path, query = ''] = raw.split('?');
      const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
      const route = parts[0] || 'home';
      const limits = { home: 1, profile: 1, projects: 2, wiki: 3, resources: 2, gallery: 2 };
      if (!Object.hasOwn(limits, route) || parts.length > limits[route]) return { route: 'not-found' };
      const params = new URLSearchParams(query);
      return { route, projectId: parts[1], pageId: parts[2], itemId: parts[1], section: params.get('section') || '', category: params.get('category') || '' };
    } catch { return { route: 'not-found', malformed: true }; }
  }

  function resolveWiki(data, state) {
    const project = projects(data).find(item => item.id === state.projectId);
    if (!project) return { error: 'project' };
    const list = pages(project);
    if (!list.length) return { project, empty: true };
    let current = state.pageId ? list.find(item => item.id === state.pageId) : list[0];
    // Preserve original generated /overview links when the project has no overview.
    if (!current && state.pageId === 'overview') current = list[0];
    if (!current) return { project, error: 'article' };
    return { project, current, canonical: wikiHref(project, current) };
  }

  function articleBlocks(article) {
    if (Array.isArray(article.blocks)) return article.blocks;
    const headings = article.headings || [];
    return (article.body || []).flatMap((text, index) => [
      ...headings.filter(h => h.before === index).map(h => ({ type: 'heading', id: h.id, text: h.title })),
      { type: (article.callouts || []).includes(index) ? 'callout' : 'paragraph', text },
      ...(article.snippets || []).filter(snippet => snippet.after === index).map(snippet => ({ type: 'code', ...snippet }))
    ]);
  }
  function blockText(block) {
    return [block.text, block.caption, ...(block.items || []), ...(block.headers || []), ...(block.rows || []).flat()].filter(Boolean).join(' ');
  }
  const articleText = article => articleBlocks(article).map(blockText).join(' ');

  function searchIndex(data) {
    return [
      ...(data.resources || []).map((item, i) => ({ type: '资源', title: item.name, summary: item.description, text: `${item.name} ${item.description} ${item.category}`, href: `#/resources/resource-${i + 1}` })),
      ...projects(data).flatMap(project => [
        { type: '项目', title: project.name, summary: project.description || project.summary, text: `${project.name} ${project.summary} ${(project.tags || []).join(' ')}`, href: projectHref(project) },
        ...pages(project).map(article => ({ type: 'Wiki', title: `${project.name} · ${article.title}`, summary: article.description || articleText(article), text: `${project.name} ${article.title} ${articleText(article)}`, href: wikiHref(project, article) }))
      ]),
      { type: '关于', title: data.profile.name, summary: data.profile.role, text: `${data.profile.name} ${data.profile.handle} ${(data.profile.introduction || []).join(' ')} ${(data.profile.links || []).map(link => `${link.name} ${link.label}`).join(' ')} ${(data.profile.groups || []).map(group => `${group.name} ${group.number}`).join(' ')}`, href: '#/profile' },
      ...(data.gallery?.artworks || []).map((artwork, i) => ({ type: '图库', title: artwork.title || '收藏稿件', summary: artwork.artist || '个人约稿', text: `${artwork.title || ''} ${artwork.artist || ''} ${artwork.note || ''}`, href: `#/gallery/artwork-${i + 1}` }))
    ];
  }
  const search = (index, query) => {
    const term = query.trim().toLocaleLowerCase();
    return term ? index.filter(item => item.text.toLocaleLowerCase().includes(term)) : [];
  };
  const api = { escapeHtml, segment, projects, pages, projectHref, wikiHref, safeUrl, parseRoute, resolveWiki, articleBlocks, articleText, searchIndex, search };
  root.SITE_CORE = Object.freeze(api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
