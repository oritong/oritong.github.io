const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../site-core.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../content.js'), 'utf8'), context);
const data = context.window.SITE_CONTENT;
const expected = [
  ['立绘', '躺躺面条', 'standing-portrait.png', 'https://huajia.163.com/main/profile/08nKpRJB'],
  ['双人插画', '再哭奶粉罐给你打翻', 'duo-illustration.jpg', 'https://huajia.163.com/main/profile/y8z3w0pB'],
  ['我在看着你', '星星睡不着', 'watching-you.png', 'https://huajia.163.com/main/profile/GBDeL74E'],
];

test('new commissions have the requested titles, artists and local display copies', () => {
  for (const [title, artist, filename, artistUrl] of expected) {
    const matches = data.gallery.artworks.filter(item => item.title === title);
    assert.equal(matches.length, 1);
    const item = matches[0];
    assert.equal(item.artist, artist);
    assert.equal(item.artistUrl, artistUrl);
    assert.equal(item.image, `assets/gallery/${filename}`);
    assert.ok(item.alt.includes(artist));
    assert.ok(fs.statSync(path.join(__dirname, '..', item.image)).size > 0);
  }
});

test('duo illustration credits and links the other character owner', () => {
  const duo = data.gallery.artworks.find(item => item.title === '双人插画');
  assert.equal(duo.coOwner, 'Water2H20');
  assert.equal(duo.coOwnerUrl, 'https://water2h2o.com/');
  assert.equal(core.safeUrl(duo.coOwnerUrl), duo.coOwnerUrl);
});

test('new artwork search results target their exact gallery cards', () => {
  const index = core.searchIndex(data);
  for (const [title] of expected) {
    const position = data.gallery.artworks.findIndex(item => item.title === title);
    assert.ok(core.search(index, title).some(item => item.href === `#/gallery/artwork-${position + 1}`));
  }
  assert.ok(data.gallery.rightsNotice.includes('禁止投喂 AI'));
});
