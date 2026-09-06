# External skill catalog

Business OS bundles the imported skill files under `.agents/skills/` so the
Skills page, Codex, and Claude can use the same project catalog. The sources
were checked on 2026-09-06 and installed without copying credentials or
executing third-party scripts. The seven sources contributed 272 discovered
skills; the final project catalog has 274 directories after preserving three
existing shared skills and deduplicating one matching name.

| Source | Revision checked | Imported skills |
| --- | --- | ---: |
| [charlie947/social-media-skills](https://github.com/charlie947/social-media-skills) | `d2e948719eafc8ed9e2436357ad18489bb371a81` | 17 |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` | 50 |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | `ccbc15639c97057cbfcf32ecebc38ef716e4bb37` | 13 |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `4aad0584d92131626b16d4ff4d77f0455385013c` | 7 |
| [anthropics/skills](https://github.com/anthropics/skills) · `frontend-design` | `41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f` | 1 |
| [anthropics/financial-services](https://github.com/anthropics/financial-services) | `69cbc81467a5dced793eee03dec4658aa24ef856` | 66 |
| [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal) | `4a6c651889c97cc9140580363c73e0eb17379c2b` | 118 |

The slide URL `anthropics/skills-frontend-design` is no longer a repository;
the current source is the `frontend-design` skill in `anthropics/skills`.

## Runtime locations

- Codex: `~/.codex/skills/`
- Claude Code: `~/.claude/skills/`
- Business OS project catalog: `.agents/skills/`

Existing same-named Codex skills were preserved. The external packs are
reference skills only: review their instructions before granting them access
to external services, and configure any required API credentials separately.
