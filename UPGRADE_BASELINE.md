# BO-000A Upgrade Baseline

Recorded before the Next.js upgrade on 2026-08-30.

| Dependency | Declared | Installed |
|---|---:|---:|
| Next.js | `^14.2.13` | `14.2.35` |
| React | `^18.3.1` | `18.3.1` |
| React DOM | `^18.3.1` | `18.3.1` |
| Node.js | — | `v22.23.2` |
| TypeScript | `^5.6.2` | `5.9.3` |
| ESLint | not declared | not installed |
| Tailwind CSS | `^3.4.12` | `3.4.19` |
| Vercel AI SDK (`ai`) | `^6.0.208` | `6.0.271` |
| better-sqlite3 | `^11.3.0` | `11.10.0` |
| lucide-react | `^0.441.0` | installed from lockfile |
| zod | `^3.23.8` | installed from lockfile |

## Baseline validation

- Production build: PASS (`next build`, Next.js 14.2.35); 50 pages generated.
- TypeScript: PASS (`npm run typecheck`).
- Development server: PASS; local server was already listening on port 4100 and served the current app.
- Existing tests: not rerun during baseline capture; prior repository validation recorded 972 passing tests.
- ESLint: NOT AVAILABLE; no ESLint package or script is declared.
- Existing warning: Next.js reports that 14.2.35 is outdated.

## Baseline scope

No source files were changed before this record. BO-000A will change only the Next.js package and compatibility code required by the upgrade.
