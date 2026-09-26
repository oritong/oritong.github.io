/* Optional browser checks. Only text, DOM and behavior: image/external requests are blocked. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createServer } = require('../scripts/serve.cjs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const routes = ['#/home', '#/profile', '#/projects', '#/projects/site-archive', '#/projects/diamond-continent-plus', '#/resources', '#/wiki', '#/wiki/site-archive/overview', '#/wiki/site-archive/structure', '#/wiki/site-archive/maintenance', '#/wiki/site-archive/deploy', '#/wiki/diamond-continent-plus/translation-method', '#/wiki/diamond-continent-plus/workflow', '#/gallery', '#/search/Minecraft'];
const widths = [320, 360, 390, 639, 640, 760, 761, 959, 960, 1100, 1440];

(async () => {
  const server = createServer();
  let browser;
  const report = { mode: 'DOM and behavior; no image contents, screenshots or external requests', widths, routes, layoutChecks: 0, interactions: [], errors: [], expectedBlockedRequests: 0 };
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    report.browser = browser.version();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    // Observe drawing calls and scheduled work without reading any canvas pixels.
    await context.addInitScript(() => {
      window.effectCheck = { fills: 0, meteorStrokes: 0, pending: new Set() };
      const fill = CanvasRenderingContext2D.prototype.fill;
      CanvasRenderingContext2D.prototype.fill = function (...args) {
        if (this.canvas.id === 'star-trail') window.effectCheck.fills++;
        return fill.apply(this, args);
      };
      const stroke = CanvasRenderingContext2D.prototype.stroke;
      CanvasRenderingContext2D.prototype.stroke = function (...args) {
        if (this.canvas.id === 'starfield') window.effectCheck.meteorStrokes++;
        return stroke.apply(this, args);
      };
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => {
        const id = request(time => { window.effectCheck.pending.delete(id); callback(time); });
        window.effectCheck.pending.add(id);
        return id;
      };
      window.cancelAnimationFrame = id => { window.effectCheck.pending.delete(id); cancel(id); };
    });
    await context.route('**/*', route => {
      if (new URL(route.request().url()).hostname !== '127.0.0.1' || route.request().resourceType() === 'image') { report.expectedBlockedRequests++; return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !message.text().includes('net::ERR_FAILED')) report.errors.push(message.text()); });
    const go = async hash => {
      await page.evaluate(value => { location.hash = value; }, hash);
      await page.waitForFunction(value => location.hash === value, hash);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    const check = (name, result) => { report.interactions.push({ name, passed: Boolean(result) }); assert.ok(result, name); };
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    check('background animation defaults to on', await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'true');
    await page.waitForFunction(() => window.effectCheck.meteorStrokes > 0, null, { timeout: 6000 });
    check('random meteor renders without pointer movement', true);
    check('project quote removed', await page.evaluate(() => {
      const section = [...document.querySelectorAll('.home-section')].find(el => el.querySelector('h2')?.textContent === '我的项目');
      return section && !section.textContent.includes('喜欢充满了童话和梦想的世界') && !section.textContent.includes('— 哦里冻');
    }));
    check('featured project fills its row', await page.locator('.featured-layout').evaluate(el => Math.abs(el.getBoundingClientRect().width - el.querySelector('.project-card').getBoundingClientRect().width) < 1));
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await go(route);
        const layout = await page.evaluate(() => {
          const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
          const style = getComputedStyle(document.documentElement);
          const hex = document.querySelector('meta[name="theme-color"]').content;
          const rgb = 'rgb(' + hex.slice(1).match(/../g).map(value => parseInt(value, 16)).join(', ') + ')';
          return { overflow: document.documentElement.scrollWidth - innerWidth, headings: document.querySelectorAll('h1').length, uniqueIds: new Set(ids).size === ids.length, styled: style.backgroundColor === rgb && style.getPropertyValue('--color-background').trim() === hex };
        });
        assert.ok(layout.overflow <= 1, width + ' ' + route + ' overflows by ' + layout.overflow);
        assert.equal(layout.headings, 1, route + ' must have one H1');
        assert.ok(layout.uniqueIds, route + ' has duplicate IDs');
        assert.ok(layout.styled, 'Stylesheet must load and parse');
        report.layoutChecks++;
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await go('#/home');
    check('only selected project is featured', await page.locator('.project-card').count() === 1);
    await page.locator('#menu-toggle').click();
    check('menu opens and focuses links', await page.evaluate(() => document.activeElement.closest('#site-navigation') !== null));
    await page.keyboard.press('Escape');
    check('menu closes and restores focus', await page.locator('#menu-toggle').evaluate(el => el === document.activeElement && el.getAttribute('aria-expanded') === 'false'));
    check('closed menu cannot receive focus', await page.locator('#site-navigation').evaluate(el => el.inert));
    await page.locator('#menu-toggle').click();
    await page.locator('#site-navigation a').nth(1).click();
    await page.waitForURL('**/#/projects');
    check('route change focuses H1', await page.locator('h1').evaluate(el => el === document.activeElement));
    check('page scrolling restored', await page.evaluate(() => !document.body.classList.contains('menu-open')));
    await go('#/wiki/diamond-continent-plus/translation-method');
    check('mobile Wiki directory collapses', !(await page.locator('#wiki-directory').evaluate(el => el.open)));
    await page.locator('#wiki-directory summary').click();
    check('Wiki directory opens', await page.locator('#wiki-directory').evaluate(el => el.open));
    await page.locator('a[data-section]').nth(2).click();
    await page.waitForFunction(() => document.activeElement.id === 'client-scripts');
    check('article anchor is shareable', page.url().endsWith('?section=client-scripts'));
    await page.locator('.article-pagination a').click();
    await page.waitForURL('**/workflow');
    check('next article works', await page.locator('h1').textContent() === '流程梳理');
    await page.evaluate(() => { location.hash = '#/wiki/diamond-continent-plus/overview'; });
    await page.waitForURL('**/translation-method');
    check('legacy Wiki alias remains functional', await page.locator('h1').textContent() === '如何将整合包翻译为不同语言');
    for (const hash of ['#/wiki/missing/overview', '#/wiki/site-archive/missing', '#/search/%', '#/missing']) {
      await go(hash); check('recovery: ' + hash, (await page.locator('h1').textContent()).includes('还没有'));
    }
    await go('#/resources');
    await page.getByRole('button', { name: '效率工具' }).click();
    check('filter matches data', await page.locator('.resource-row').count() === 2);
    await page.reload({ waitUntil: 'domcontentloaded' });
    check('filter survives refresh', await page.locator('.resource-row').count() === 2);
    await page.locator('#site-search').fill('Regex101');
    await page.locator('#site-search').press('ArrowDown');
    check('search keyboard suggestions', await page.evaluate(() => document.activeElement.classList.contains('search-result-row')));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement.id === 'resource-12');
    check('search locates exact resource', page.url().endsWith('/resources/resource-12'));
    await page.locator('#site-search').fill('kubejs//assets');
    await page.locator('#site-search').press('Enter');
    await page.waitForFunction(() => document.querySelector('h1').textContent.includes('kubejs//assets'));
    check('search query preserved', true);
    await page.locator('#site-search').fill('鰹ノえぼシ');
    await page.locator('.search-result-row').first().click();
    await page.waitForFunction(() => document.activeElement.id === 'artwork-1');
    check('search locates exact artwork', page.url().endsWith('/gallery/artwork-1'));
    check('gallery references retained', await page.locator('.gallery-image-frame img').count() === 6);
    check('artist links retained', await page.locator('.gallery-artist-link').count() === 6);
    await go('#/profile');
    // Mock only the clipboard to avoid replacing the user's system clipboard on reruns.
    await page.evaluate(() => { window.testClipboard = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.testClipboard = text; } } }); });
    await page.locator('[data-copy-group]').first().click();
    check('QQ copy output', await page.evaluate(() => window.testClipboard) === '946391190');
    await go('#/wiki/diamond-continent-plus/translation-method');
    await page.locator('[data-copy-code]').click();
    check('code copy output', await page.evaluate(() => window.testClipboard) === "ClientEvents.lang('en_us', e => {");
    await page.locator('.appearance-settings summary').click();
    await page.locator('#motion-toggle').click();
    check('background can be disabled separately', await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'false');
    check('star trail defaults to on', await page.locator('#trail-toggle').getAttribute('aria-pressed') === 'true');
    const fillsBefore = await page.evaluate(() => window.effectCheck.fills);
    await page.mouse.move(100, 150);
    await page.mouse.move(260, 270, { steps: 8 });
    await page.waitForFunction(count => window.effectCheck.fills > count, fillsBefore);
    check('mouse movement draws stars with background disabled', true);
    await page.waitForTimeout(1200);
    check('trail stops requesting frames after fading', await page.evaluate(() => window.effectCheck.pending.size === 0));
    const afterFade = await page.evaluate(() => window.effectCheck.fills);
    await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: 100, clientY: 100 })));
    await page.waitForTimeout(100);
    check('touch does not generate stars', await page.evaluate(() => window.effectCheck.fills) === afterFade);
    check('trail does not intercept input', await page.locator('#star-trail').evaluate(el => getComputedStyle(el).pointerEvents === 'none'));
    await page.locator('#trail-toggle').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    check('trail can be disabled and choice persists', await page.locator('#trail-toggle').getAttribute('aria-pressed') === 'false');
    check('background disabled choice persists', await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'false');
    await page.locator('.appearance-settings summary').click();
    await page.locator('#trail-toggle').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    check('trail can be reenabled and choice persists', await page.locator('#trail-toggle').getAttribute('aria-pressed') === 'true');
    await page.locator('.appearance-settings summary').click();
    await page.locator('#motion-toggle').click();
    check('effects can be enabled', await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'true');
    await page.reload({ waitUntil: 'domcontentloaded' });
    check('effect choice persists', await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.getElementById('motion-toggle').disabled);
    check('reduced motion takes priority', await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'false' && await page.locator('#trail-toggle').getAttribute('aria-pressed') === 'false' && await page.locator('#trail-toggle').isDisabled());
    check('reduced motion stops both canvases', await page.evaluate(() => window.effectCheck.pending.size === 0 && getComputedStyle(document.getElementById('star-trail')).display === 'none'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });
    await go('#/wiki/diamond-continent-plus/translation-method');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    check('article reflows at 200 percent text size', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(report.errors, []);
    report.passed = true;
    console.log(JSON.stringify({ passed: true, layoutChecks: report.layoutChecks, interactions: report.interactions.length, errors: report.errors }, null, 2));
  } catch (error) {
    report.passed = false; report.failure = error.message; process.exitCode = 1; console.error(error);
  } finally {
    await fs.writeFile(path.join(__dirname, '../docs/browser-checks.json'), JSON.stringify(report, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})();
