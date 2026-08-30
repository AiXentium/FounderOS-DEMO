import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';

export function runMigrations(db: InstanceType<typeof Database>): void {
  const directory = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(directory)) return;
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const files = fs.readdirSync(directory).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  for (const file of files) {
    const applied = db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?').get(file);
    if (applied) continue;
    const sql = fs.readFileSync(path.join(directory, file), 'utf8');
    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    });
    transaction();
  }
}
