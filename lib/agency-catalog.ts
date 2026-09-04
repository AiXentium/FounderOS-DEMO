import fs from 'node:fs';
import path from 'node:path';
import type { Agent } from '@/lib/schemas';
import type { RuntimeAgent } from '@/lib/agents/runtime';

type AgencyDefinition = { id: string; name: string; category: string; description: string; file: string };

function walk(dir: string, out: string[] = []): string[] {
  try { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { if (entry.name.startsWith('.')) continue; const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full, out); else if (entry.name.endsWith('.md') && !full.includes(`${path.sep}integrations${path.sep}`)) out.push(full); } } catch { /* optional library */ }
  return out;
}
const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fm = (raw: string, key: string) => raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
function definitions(): AgencyDefinition[] { const root = path.join(process.cwd(), 'agency-agents'); return walk(root).map((file) => { const raw = fs.readFileSync(file, 'utf8'); if (!raw.startsWith('---') || !fm(raw, 'name')) return null; const base = path.basename(file, '.md'); return { id: `agency-${slug(base)}`, name: fm(raw, 'name'), category: path.relative(root, file).split(path.sep)[0] || 'specialized', description: fm(raw, 'description') || 'Agency specialist.', file: path.relative(root, file).split(path.sep).join('/') }; }).filter((d): d is AgencyDefinition => Boolean(d)).sort((a, b) => a.id.localeCompare(b.id)); }
function department(category: string): string { if (['engineering', 'integrations', 'spatial-computing', 'game-development'].includes(category)) return 'dept-tech'; if (['design', 'marketing', 'paid-media'].includes(category)) return 'dept-marketing-growth'; if (category === 'sales') return 'dept-sales'; return 'dept-clients'; }
export function agencyDefinitions() { return definitions(); }
export function agencySeedAgents(): Agent[] { return definitions().map((d) => ({ id: d.id, departmentId: department(d.category), name: d.name, role: `${d.category} specialist`, status: 'active' as const, tier: 'specialist' as const, description: `${d.description} Loaded from agency-agents/${d.file} and grounded by shared G-Brain.`, model: 'shared LLM + G-Brain', tools: ['gbrain'], parentId: null, instance: 'builtin' })); }
export function agencyRuntimeAgents(): RuntimeAgent[] { return definitions().map((d) => ({ id: d.id, name: d.name, description: `${d.description} Agency source: ${d.file}.`, departmentId: department(d.category), async run() { return { ok: true, summary: `${d.name} ready · shared G-Brain grounding enabled`, data: { source: d.file } }; } })); }
