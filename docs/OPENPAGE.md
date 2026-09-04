# OpenPage Lab

OpenPage Lab is a separate, JSON-first website workspace inside Business OS. It is intentionally additive: the existing `/website-builder` route and its WordPress/Elementor workflows remain unchanged.

## Boundaries

- OpenPage projects are stored in `website_projects` with `workspaceId: openpage`.
- Existing Website Builder projects remain in the `default` workspace.
- OpenPage memory is captured through G-Brain under the physical `openpage/` folder and searched only within that namespace.
- The CMS/website specialist owns the OpenPage tools so the Conductor can route requests to the right live agent.
- OpenPage saves local drafts and exports standalone HTML. WordPress publishing is still a separate, approval-gated CMS operation.

## Live paths

- UI: `/openpage`
- API: `/api/openpage`
- Agent tools: `inspectOpenPageWorkspace`, `searchOpenPageMemory`, `createOpenPageDraft`, `updateOpenPageDraft`
- Schema: `openpage-v1` in `lib/openpage.ts`

## Workflow

1. Write a brief or load the Barcelona starter.
2. Generate with Gemini when `GEMINI_API_KEY` is configured. OpenPage checks the local `env.txt` during development and the Railway variable in production. If Gemini is unavailable, it falls back to the existing OpenAI/Gateway provider and labels the response accordingly.
3. Edit block order and copy in the structured editor.
4. Save to the OpenPage vault. This persists the JSON project and captures a concise G-Brain memory note.
5. Export standalone HTML for review. Publishing to WordPress is intentionally not implicit.

## Gemini configuration

- Local development: set `GEMINI_API_KEY` in the project environment or the shared `env.txt` file outside the repository.
- Railway: add `GEMINI_API_KEY` as a service variable for the Business OS deployment. Never commit the key or place it in client-side code.
- The OpenPage header reports only the provider and model status; the key itself is never returned by the API.
