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
    const typeIndex = process.argv.indexOf('--type');
    const slugIndex = process.argv.indexOf('--slug');
    const type = typeIndex >= 0 ? process.argv[typeIndex + 1] : '';
    const requestedSlug = slugIndex >= 0 ? process.argv[slugIndex + 1] : '';
    // Keep namespaces physically separate. OpenPage passes an openpage/<slug>
    // slug; older captures continue to land in inbox (or their requested type).
    const safeSlug = requestedSlug
      ? requestedSlug.replace(/\\/g, '/').replace(/^\/+|\.\.+/g, '').replace(/[^a-zA-Z0-9_./-]/g, '-')
      : '';
    const relativeFile = safeSlug ? `${safeSlug.replace(/\.md$/i, '')}.md` : `${type || process.env.GBRAIN_CAPTURE_FOLDER || 'inbox'}/capture-${Date.now()}.md`;
    const dir = path.dirname(path.join(store, relativeFile));
    fs.mkdirSync(dir, { recursive: true });
    const outputFile = path.join(store, relativeFile);
    fs.writeFileSync(outputFile, body, 'utf8');
    process.stdout.write(JSON.stringify({ slug: relativeFile.replace(/\\/g, '/').replace(/\.md$/i, ''), content_hash: '' }));
  });
} else {
  process.stderr.write(`unsupported command: ${cmd}`);
  process.exitCode = 1;
}
