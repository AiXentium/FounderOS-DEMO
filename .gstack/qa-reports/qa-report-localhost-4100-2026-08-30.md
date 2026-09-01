# QA Report — localhost:4100

- Date: 2026-08-30
- Target: `http://localhost:4100`
- Mode: Full route and interaction smoke review
- Framework: Next.js 14 / React 18
- Pages/routes visited: 22 (home plus all 21 sidebar routes)
- Browser: Codex In-app Browser
- Existing repository changes: preserved; only the two QA commits below were added

## Summary

QA found one reproducible medium-severity console defect and fixed it.

| Measure | Before | After |
| --- | ---: | ---: |
| Health score | 96 | 100 |
| Console warnings/errors | 1 hydration warning | 0 |
| Broken route loads | 0 | 0 |
| Verified fixes | — | 1 |

## ISSUE-001 — BrainViz hydration mismatch

- Severity: Medium
- Category: Console / Functional stability
- Status: Verified
- Repro: Open a fresh browser tab at `/doctor`. React logged `Prop did not match` for SVG `x`/`y` attributes emitted by `BrainViz`; the server and client values differed at the 1e-14 level.
- User impact: The visualization still painted, but every page mounting the shared knowledge-core visual emitted a hydration warning and could mask real render defects.
- Fix: Round `layoutBrainNodes` coordinates to two decimals before passing them to SVG attributes.
- Fix commit: `0baa8c6`
- Regression test commit: `f0fff47`
- Files: `lib/brain-viz.ts`, `tests/brain-viz.regression-1.test.ts`
- Before evidence: fresh `/doctor` load showed the warning and the rendered radar/core visual.
- After evidence: fresh `/doctor` load rendered the same visual with zero warning/error logs; doctor/search modal opened with zero warning/error logs.

## Browser coverage

- Home dashboard loaded at desktop and mobile-sized viewport.
- All sidebar destinations loaded with expected headings: Comms, Funnel, Workflows, Social, Affiliate Studio, Website Builder, Content, Finances, Business Setup, Agents, Tasks, Skills, Org Chart, G-Brain, Doctor, Connections, Job Operations, Roadmap, Analytics, Reference Model, and Personas.
- Builder controls: mobile preview and Testimonials block toggled successfully.
- Social controls: 30-day period control activated successfully.
- Setup validation: Analyze remained disabled with an empty/partial intake.
- Affiliate validation: empty product import was handled without a console error.
- Doctor interaction: central health control opened Doctor · Search modal successfully.

## Verification

- `npx vitest run --cache false`: 111 test files passed, 972 tests passed.
- `npx vitest run --cache false tests/brain-viz.regression-1.test.ts`: 1 test passed.
- `npx tsc --noEmit --incremental false`: passed.
- Post-fix fresh browser tabs: `/doctor`, `/website-builder`, `/social`, and mobile-sized `/` loaded with zero warning/error logs.

## Deferred / concerns

- No additional high-confidence local defect was found in the exercised flows.
- The verification copy had pre-existing uncommitted changes before this QA pass; they remain untouched.

## PR summary

QA found 1 issue, fixed 1, health score 96 → 100.
