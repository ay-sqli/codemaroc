// Mini serveur statique qui imite GitHub Pages : sert ROOT sous /PREFIX/.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const [root, prefix = "/codemaroc", port = "4321"] = process.argv.slice(2);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".txt": "text/plain", ".csv": "text/csv", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon" };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (!url.startsWith(prefix + "/")) { res.writeHead(404); return res.end("hors du préfixe"); }
  let file = path.join(root, url.slice(prefix.length));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404, { "content-type": types[".html"] }); return fs.createReadStream(path.join(root, "404.html")).pipe(res); }
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(+port, () => console.log(`http://localhost:${port}${prefix}/`));
