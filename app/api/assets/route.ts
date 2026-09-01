import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { ASSET_DIR, listAssets, safeAssetFolder, safeAssetName, safeAssetPath } from '@/lib/assets';

const execFileAsync = promisify(execFile);

function findAsset(name: string) {
  return listAssets().find((asset) => asset.name === name || asset.storageName === name);
}

function assetUrl(name: string) {
  return `/api/assets?name=${encodeURIComponent(name)}`;
}

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name');
  if (name) {
    if (safeAssetPath(name) !== name) return NextResponse.json({ error: 'invalid asset name' }, { status: 400 });
    try {
      const asset = findAsset(name);
      if (!asset) throw new Error('missing');
      const file = await fs.readFile(path.join(ASSET_DIR, asset.storageName));
      const ext = path.extname(asset.name).toLowerCase();
      const types: Record<string, string> = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.zip': 'application/zip', '.json': 'application/json',
      };
      return new NextResponse(file, {
        headers: { 'content-type': types[ext] ?? 'application/octet-stream', 'cache-control': 'private, max-age=3600' },
      });
    } catch {
      return NextResponse.json({ error: 'asset not found' }, { status: 404 });
    }
  }
  return NextResponse.json({
    assets: listAssets().map((asset) => ({ ...asset, modifiedAt: new Date().toISOString(), url: assetUrl(asset.storageName) })),
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 });
  if (file.size > 500 * 1024 * 1024) return NextResponse.json({ error: 'maximum file size is 500MB' }, { status: 413 });

  await fs.mkdir(ASSET_DIR, { recursive: true });
  const folder = safeAssetFolder(String(form.get('folder') || 'general'));
  const name = `${folder}--${Date.now()}-${safeAssetName(file.name)}`;
  const filePath = path.join(ASSET_DIR, name);
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  if (/\.zip$/i.test(file.name)) {
    const folderPath = path.join(ASSET_DIR, `${folder}--${Date.now()}-extracted`);
    await fs.mkdir(folderPath, { recursive: true });
    try {
      const { stdout } = await execFileAsync('unzip', ['-Z1', filePath]);
      const entries = stdout.split('\n').filter(Boolean);
      if (entries.some((entry) => entry.startsWith('/') || entry.split('/').includes('..'))) throw new Error('unsafe ZIP paths');
      await execFileAsync('unzip', ['-q', '-j', filePath, '-d', folderPath]);
      return NextResponse.json({ asset: { name, size: file.size }, extracted: entries.length, folder }, { status: 201 });
    } catch (error) {
      await fs.rm(folderPath, { recursive: true, force: true });
      return NextResponse.json({ error: error instanceof Error ? error.message : 'ZIP extraction failed' }, { status: 422 });
    }
  }
  return NextResponse.json({ asset: { name, size: file.size } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const name = new URL(request.url).searchParams.get('name');
  if (!name || safeAssetPath(name) !== name) return NextResponse.json({ error: 'invalid asset name' }, { status: 400 });
  try {
    const asset = findAsset(name);
    if (!asset) throw new Error('missing');
    await fs.unlink(path.join(ASSET_DIR, asset.storageName));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'asset not found' }, { status: 404 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const oldName = typeof body.name === 'string' ? body.name : '';
  const newName = typeof body.newName === 'string' ? safeAssetName(body.newName) : '';
  if (!oldName || safeAssetPath(oldName) !== oldName || !newName || newName !== body.newName) {
    return NextResponse.json({ error: 'invalid asset name' }, { status: 400 });
  }
  try {
    const asset = findAsset(oldName);
    if (!asset) throw new Error('missing');
    const relativeDir = asset.storageName.includes('/') ? path.posix.dirname(asset.storageName) : '';
    const target = relativeDir ? `${relativeDir}/${newName}` : `${asset.folder}--${newName}`;
    await fs.rename(path.join(ASSET_DIR, asset.storageName), path.join(ASSET_DIR, target));
    return NextResponse.json({ ok: true, asset: { name: newName, storageName: target } });
  } catch {
    return NextResponse.json({ error: 'asset not found or name already exists' }, { status: 404 });
  }
}
