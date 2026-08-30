# Business OS v2 Quality Gate

## Required commands

Run the single gate from the repository root:

```bash
npm run verify
```

It runs, in order, and stops at the first failure:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`

Individual commands remain available for focused development. `npm run dev` starts the local app on port 4100.

## Tool baseline

- Next.js 15.5.24
- React 18.3.1
- Node.js 22.23.2
- TypeScript 5.9.3
- ESLint 9.39.5
- `eslint-config-next` 15.5.24
- Tailwind CSS 3.4.19
- Vercel AI SDK (`ai`) 6.0.271

## Definition of Done

A change is ready when TypeScript, ESLint, all tests, and the production build pass through `npm run verify`; affected behavior has a regression test; documentation is updated; and the application has been checked locally. Existing import-order and explicit-`any` findings are warnings during the baseline and must not increase.

## Release validation checklist

- [ ] `npm run verify` passes from a clean checkout.
- [ ] No ESLint errors remain.
- [ ] No new accessibility or React Hooks violations remain.
- [ ] Production build completes successfully.
- [ ] Browser smoke checks cover dashboard, navigation, theme, setup, settings, and APIs.
- [ ] Version numbers and known warnings are recorded in the mission log.
