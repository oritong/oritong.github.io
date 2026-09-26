const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const core = require('../site-core.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../content.js'), 'utf8'), context);
const data = JSON.parse(JSON.stringify(context.window.SITE_CONTENT));

test('existing six Wiki routes resolve without changing their content', () => {
  for (const project of data.projects) {
    for (const article of project.pages) {
      const resolved = core.resolveWiki(data, core.parseRoute(core.wikiHref(project, article)));
      assert.equal(resolved.current, article);
      for (const paragraph of article.body) assert.ok(core.articleText(article).includes(paragraph));
    }
  }
});
test('legacy generated overview maps only to its own project', () => {
  const resolved = core.resolveWiki(data, core.parseRoute('#/wiki/diamond-continent-plus/overview'));
  assert.equal(resolved.project.id, 'diamond-continent-plus');
  assert.equal(resolved.current.id, 'translation-method');
});
test('unknown project and article never fall back to unrelated content', () => {
  assert.equal(core.resolveWiki(data, core.parseRoute('#/wiki/missing/overview')).error, 'project');
  assert.equal(core.resolveWiki(data, core.parseRoute('#/wiki/site-archive/missing')).error, 'article');
});
test('malformed and extra route segments have recovery states', () => {
  for (const hash of ['#/search/%', '#/wiki/%E0%A4%A', '#/unknown', '#/home/extra', '#/projects/a/b', '#/constructor']) {
    assert.equal(core.parseRoute(hash).route, 'not-found');
  }
});
test('search query round trips with slashes, Unicode, percent and query punctuation', () => {
  for (const query of ['kubejs//assets', 'https://example.test/?a=2#x', '哦里冻 100%', '/leading/trailing/']) {
    assert.equal(core.parseRoute('#/search/' + encodeURIComponent(query)).query, query);
  }
});
test('Wiki section and resource category survive encoding', () => {
  assert.equal(core.parseRoute('#/resources?category=' + encodeURIComponent('效率工具')).category, '效率工具');
  assert.equal(core.parseRoute('#/wiki/a/b?section=language-files').section, 'language-files');
});
test('participations are available in project, Wiki and search data', () => {
  const fixture = { ...data, participations: [{ id: 'test-team', name: '协作测试', summary: '测试', pages: [{ id: 'intro', title: '说明', body: ['文档测试'] }] }] };
  assert.equal(core.projects(fixture).length, data.projects.length + 1);
  assert.equal(core.resolveWiki(fixture, core.parseRoute('#/wiki/test-team/intro')).current.title, '说明');
  assert.ok(core.searchIndex(fixture).some(item => item.href === '#/wiki/test-team/intro'));
});
test('projects without Wiki remain valid', () => {
  const fixture = { ...data, projects: [{ id: 'empty', name: '测试', summary: '测试' }] };
  assert.equal(core.resolveWiki(fixture, core.parseRoute('#/wiki/empty')).empty, true);
  assert.equal(core.searchIndex(fixture).find(item => item.type === '项目').href, '#/projects/empty');
});
test('resource and gallery search targets identify exact records', () => {
  const index = core.searchIndex(data);
  assert.equal(core.search(index, 'Regex101')[0].href, '#/resources/resource-12');
  assert.equal(core.search(index, '个人形象设定图')[0].href, '#/gallery/artwork-1');
  assert.equal(core.search(index, '     ').length, 0);
});
test('all search Wiki targets resolve; project targets use details', () => {
  for (const item of core.searchIndex(data)) {
    const state = core.parseRoute(item.href);
    if (item.type === 'Wiki') assert.ok(core.resolveWiki(data, state).current);
    if (item.type === '项目') assert.ok(core.projects(data).some(p => p.id === state.projectId));
  }
});
test('content IDs are unique and homepage selection is explicit', () => {
  const projects = core.projects(data);
  assert.equal(new Set(projects.map(p => p.id)).size, projects.length);
  for (const project of projects) assert.equal(new Set(core.pages(project).map(p => p.id)).size, core.pages(project).length);
  assert.ok(data.home.featuredProjects.length < projects.length);
  for (const id of [...data.home.featuredProjects, ...data.home.currentProjects]) assert.ok(projects.some(p => p.id === id));
});
test('HTML and URL handling keeps strings inert', () => {
  assert.equal(core.escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
  assert.equal(core.safeUrl('javascript:alert(1)'), '#/profile');
  assert.equal(core.safeUrl('https://github.com/oritong'), 'https://github.com/oritong');
});
test('image references exist without opening image contents', () => {
  for (const reference of [data.profile.avatar, ...data.gallery.artworks.map(a => a.image)]) assert.ok(fs.statSync(path.join(__dirname, '..', reference)).isFile());
});
test('base reading and interactive color pairs have sufficient contrast', () => {
  const css = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
  const color = name => css.match(new RegExp('--color-' + name + ':\\s*(#[0-9a-fA-F]{6})'))[1];
  const luminance = hex => hex.slice(1).match(/../g).map(s => parseInt(s, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
  const contrast = (a, b) => { const values = [luminance(color(a)), luminance(color(b))].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); };
  for (const surface of ['background', 'surface', 'card', 'active']) for (const text of ['text', 'muted', 'primary']) assert.ok(contrast(text, surface) >= 4.5, text + ' / ' + surface);
  assert.ok(contrast('on-primary', 'primary') >= 4.5);
});
