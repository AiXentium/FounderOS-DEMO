import fs from 'node:fs';
import path from 'node:path';

export const ASSET_DIR = path.join(process.cwd(), 'data', 'assets');
export function safeAssetName(name: string) { return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '-'); }
export function safeAssetFolder(name: string) { return safeAssetName(name).replace(/\./g, '-').slice(0, 40) || 'general'; }
export function safeAssetPath(name: string) { const normalized = name.replace(/\\/g, '/'); if (!normalized || normalized.startsWith('/') || normalized.split('/').some((part) => part === '..' || part === '.')) return ''; return normalized.split('/').map(safeAssetName).join('/'); }
export function listAssets() {
  if (!fs.existsSync(ASSET_DIR)) return [];
  const assets: { name: string; storageName: string; folder: string; size: number }[] = []; const walk = (dir: string, relative = '') => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const storageName = relative ? `${relative}/${entry.name}` : entry.name; if (entry.isDirectory()) walk(path.join(dir, entry.name), storageName); else if (entry.isFile()) { const [folder, ...rest] = storageName.split('--'); assets.push({ name: rest.length ? rest.join('--') : storageName, storageName, folder: rest.length ? folder : 'general', size: fs.statSync(path.join(dir, entry.name)).size }); } } }; walk(ASSET_DIR); return assets;
}
