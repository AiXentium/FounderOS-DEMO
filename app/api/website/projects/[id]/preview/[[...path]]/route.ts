import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2' };

export async function GET(request: Request, context: { params: Promise<{ id: string; path?: string[] }> }) {
  const { id, path: parts = [] } = await context.params;
  const project = getDb().websiteProjects.all('default').find((item: any) => item.id === id) as any;
  const root = project?.page?.packageRoot;
  if (!root) return NextResponse.json({ error: 'Imported project files are unavailable.' }, { status: 404 });
  const requested = parts.length ? parts.join('/') : (project.page.entryFile ? path.relative(root, project.page.entryFile) : 'index.html');
  const file = path.resolve(root, requested);
  if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
  const data = await fs.readFile(file).catch(() => null);
  if (!data) return NextResponse.json({ error: 'Preview file not found.' }, { status: 404 });
  const ext = path.extname(file).toLowerCase();
  if (ext === '.html') {
    const base = new URL(request.url).toString().replace(/\/[^/]*$/, '/');
    const html = data.toString('utf8').replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
    return new NextResponse(html, { headers: { 'content-type': MIME[ext] } });
  }
  return new NextResponse(data, { headers: { 'content-type': MIME[ext] ?? 'application/octet-stream', 'cache-control': 'public, max-age=3600' } });
}
