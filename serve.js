const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = fs.existsSync(path.join(__dirname, 'web-build', 'index.html'))
  ? path.join(__dirname, 'web-build')
  : path.join(__dirname, 'pawcare-web');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // Strip query strings
  let reqUrl = req.url.split('?')[0];
  let safeSuffix = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safeSuffix);

  // If path is a directory or root, serve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // SPA fallback to index.html if file doesn't exist
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading ' + req.url);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`PawCare web server running on:`);
  console.log(`http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
