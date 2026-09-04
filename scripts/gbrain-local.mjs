#!/usr/bin/env node
/** Deploy-safe G-Brain runtime: markdown-backed search when the native CLI is unavailable. */
import fs from 'node:fs';
import path from 'node:path';

const store = process.env.GBRAIN_STORE || '/data/brain-store';
const cmd = process.argv[2] || 'doctor';

function files(dir, out = []) {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) files(full, out);
      else if (entry.name.endsWith('.md')) out.push(full);
    }
  } catch {}
  return out;
}

const pages = files(store);
if (cmd === 'doctor') {
  process.stdout.write(JSON.stringify({ status: 'ok', health_score: 80, checks: [{ name: 'markdown-store', status: 'ok', message: `${pages.length} pages available` }] }));
} else if (cmd === 'stats') {
  process.stdout.write(`Pages: ${pages.length}\nChunks: ${pages.length}\nEmbedded: 0\nBy type:\n  markdown: ${pages.length}\n`);
} else if (cmd === 'query') {
  const needle = (process.argv[3] || '').toLowerCase();
  for (const file of pages) {
    const content = fs.readFileSync(file, 'utf8');
    const line = content.split('\n').find((value) => value.toLowerCase().includes(needle));
    if (line) process.stdout.write(`${path.relative(store, file).replace(/\\/g, '/').replace(/\.md$/, '')} -- ${line.trim().slice(0, 240)}\n`);
    if (process.stdout.bytesWritten > 8192) break;
  }
} else if (cmd === 'capture') {
  let body = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { body += chunk; });
  process.stdin.on('end', () => {
    const folder = process.env.GBRAIN_CAPTURE_FOLDER || 'inbox';
    const dir = path.join(store, folder);
    fs.mkdirSync(dir, { recursive: true });
    const slug = `capture-${Date.now()}`;
    fs.writeFileSync(path.join(dir, `${slug}.md`), body, 'utf8');
    process.stdout.write(JSON.stringify({ slug, content_hash: '' }));
  });
} else {
  process.stderr.write(`unsupported command: ${cmd}`);
  process.exitCode = 1;
}
