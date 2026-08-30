# React 19 Upgrade Baseline

Date: 2026-08-30

## Versions

| Package | Baseline |
| --- | --- |
| Next.js | 15.5.24 |
| React | ^18.3.1 |
| React DOM | ^18.3.1 |
| Node.js | 22.23.2 |
| TypeScript | 5.9.3 |
| AI SDK | ^6.0.208 |
| Tailwind CSS | ^3.4.12 |
| Test runner | Vitest |

## Rendering model

The application uses the Next.js App Router. Components are Server Components by default; 57 files explicitly opt into Client Components with `use client`. No legacy `ReactDOM.render` usage was found. Existing Suspense, dynamic imports, context providers, hooks, forms, error boundaries, and lazy-loading patterns are retained for the compatibility review.

## React-integrated dependencies

The repository uses Next.js, Tailwind CSS, the Vercel AI SDK, D3 force rendering, and Vitest. React Hook Form, Radix UI, shadcn/ui, rich-text editors, drag-and-drop libraries, and React Testing Library are not installed. No incompatible React integration was identified before the upgrade.

## Pre-upgrade validation

- TypeScript: passed before upgrade.
- ESLint: passed before upgrade; existing warnings are documented by the quality baseline.
- Tests: 112 test files / 974 tests passed before upgrade.
- Production build: passed before upgrade.
- Existing React runtime warnings: none observed in the pre-upgrade build and test validation.
