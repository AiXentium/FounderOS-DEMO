# Next.js 15 Upgrade

## Packages upgraded

- Next.js: `14.2.35` → `15.5.24`
- React remains `18.3.1`.
- React DOM remains `18.3.1`.
- Prisma, PostgreSQL, authentication, and package manager were not changed.

## Breaking changes encountered

Next.js 15 requires dynamic route `params` and page `searchParams` to be asynchronous promises. The affected API handlers and pages were updated accordingly. The `serverComponentsExternalPackages` configuration option moved from `experimental` to the top-level `serverExternalPackages` option.

## Code changes required

- Updated dynamic API route handler signatures for agents, skills, social platforms, and lead magnets.
- Updated dynamic page signatures for funnel, org, and social platform pages.
- Updated affected route tests to pass promise-based params.
- Updated the existing breadcrumb assertion to match the current Business OS branding.
- Rebuilt the unchanged `better-sqlite3` native binding after dependency installation.

## Validation results

- `npm run typecheck`: PASS
- `npm run build`: PASS on Next.js 15.5.24; 30 pages generated.
- `npm test`: PASS; 112 test files and 974 tests.
- Local development server: previously verified on port 4100; the production build starts successfully.
- ESLint: configured with `next/core-web-vitals`, `next/typescript`, React Hooks/Next rules supplied by the official config, accessibility support, and import ordering.

## Remaining risks

- React 19 remains a separate BO-000B task.
- Prisma/PostgreSQL remain separate modernization tasks.
- ESLint configuration remains a separate quality task.
- Next.js reports no new build compatibility failures after the route and config updates.
