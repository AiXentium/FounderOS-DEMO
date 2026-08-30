import path from 'node:path';
import fs from 'node:fs';
import { openDb } from '../lib/db';

const dbPath = process.env.FOUNDER_OS_DB ?? path.join(process.cwd(), 'data', 'founder-os.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = openDb(dbPath);
console.log(`Migrations applied to ${dbPath}`);
db.close();
