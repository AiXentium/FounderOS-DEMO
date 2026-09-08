import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import AdmZip from 'adm-zip';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

const ROOT = path.join(process.cwd(), 'data', 'website-projects');
const badEntry = (entry: string) => entry.replaceAll('\\', '/').startsWith('/') || entry.replaceAll('\\', '/').split('/').includes('..');
const readJson = async (file: string) => JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, unknown>;
const detectProjectType = (entries: string[]) => entries.some(x => /(^|\/)package\.json$/i.test(x)) ? 'node-web' : entries.some(x => /(^|\/)(manage\.py|app\.py|main\.py)$/i.test(x)) ? 'python-web' : entries.some(x => /(^|\/)index\.html$/i.test(x)) ? 'static-web' : 'web-project';

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('package');
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.zip')) return NextResponse.json({ error: 'Upload a .zip website package.' }, { status: 400 });
  if (file.size > 500 * 1024 * 1024) return NextResponse.json({ error: 'Maximum package size is 500MB.' }, { status: 413 });
  const id = randomUUID(); const temp = path.join('/tmp', `${id}.zip`); const destination = path.join(ROOT, id);
  try {
    await fs.mkdir(ROOT, { recursive: true }); await fs.writeFile(temp, Buffer.from(await file.arrayBuffer()));
    const zip = new AdmZip(temp); const entries = zip.getEntries().map(entry => entry.entryName).filter(Boolean);
    if (!entries.length || entries.some(badEntry)) throw new Error('Invalid or unsafe ZIP package.');
    for (const entry of zip.getEntries()) {
      const target = path.resolve(destination, entry.entryName);
      if (!target.startsWith(`${path.resolve(destination)}${path.sep}`)) throw new Error('Invalid or unsafe ZIP package.');
      if (entry.isDirectory) await fs.mkdir(target, { recursive: true });
      else { await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, entry.getData()); }
    }
    let root = destination;
    if (!(await fs.stat(path.join(root, '.project.json')).catch(() => null))) {
      const nested = (await fs.readdir(root, { withFileTypes: true })).find(x => x.isDirectory());
      if (!nested) throw new Error('Package is missing .project.json.'); root = path.join(root, nested.name);
    }
    const manifest = await readJson(path.join(root, '.project.json'));
    const builder = await readJson(path.join(root, '.builder.json')).catch(() => ({}));
    const pages: Array<{ title: string; slug: string; file: string }> = [];
    const visit = async (dir: string) => { for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const current = path.join(dir, entry.name); if (entry.isDirectory()) await visit(current); else if (entry.name.toLowerCase() === 'index.html') { const html = await fs.readFile(current, 'utf8'); const rel = path.relative(root, current).replaceAll('\\', '/'); pages.push({ title: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || rel, slug: rel === 'index.html' ? 'home' : rel.replace(/\/index\.html$/, ''), file: current }); } } };
    await visit(root);
    if (!pages.length) throw new Error('Package contains no index.html pages.');
    const homePage = pages.find(page => page.slug === 'home') ?? pages[0];
    const homeSource = await fs.readFile(homePage.file, 'utf8');
    const contentHtml = homeSource.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? homeSource;
    const project = { id, name: String(manifest.name ?? manifest.title ?? file.name.replace(/\.zip$/i, '')), prompt: `Imported website package: ${file.name}`, direction: 'editorial', page: { title: String(manifest.name ?? manifest.title ?? file.name), blocks: pages.map(page => page.title), generated: true, contentHtml, sourceType: 'website-package', projectType: detectProjectType(entries), packageRoot: root, entryFile: homePage.file, pages, builder }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    getDb().websiteProjects.save(project);
    await fs.unlink(temp).catch(() => undefined);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) { await fs.rm(destination, { recursive: true, force: true }).catch(() => undefined); await fs.unlink(temp).catch(() => undefined); return NextResponse.json({ error: error instanceof Error ? error.message : 'Package import failed' }, { status: 422 }); }
}
