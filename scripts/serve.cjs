/* Optional local preview. No packages or build step required. */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon' };
function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      const relative = path.relative(root, file);
      const type = mime[path.extname(file).toLowerCase()];
      if (relative.startsWith('..') || path.isAbsolute(relative) || !type) { res.writeHead(404).end('Not found'); return; }
      const bytes = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(bytes);
    } catch { res.writeHead(404).end('Not found'); }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || process.argv[2] || 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Use a port from 0 to 65535.');
  const server = createServer();
  server.on('error', error => { console.error(error.message); console.error('Choose a free port: node scripts/serve.cjs 4174'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:' + server.address().port));
}
module.exports = { createServer };
