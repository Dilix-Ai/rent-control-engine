# Public launch checklist — `@dilix/rent-control-engine`

Step-by-step from "local repo" to "people can install it from npm and
read the README on GitHub." Designed to be runnable in one sitting once
the org-name decision is made.

> Status as of 2026-05-03: code, tests, docs, examples, CI workflow
> all ready. Branch is `main`. 37 tests passing locally.
> GitHub org `dilix-ai` and npm scope `@dilix` decided + claimed.

## Pre-launch decision (founder) — DONE

- [x] **GitHub org name:** `dilix-ai` (created 2026-05-03 — `dilix` was squatted).
- [x] **npm scope:** `@dilix` (zero existing packages — claimable on first publish).
- [x] **Public-vs-private confirmation:** Public, MIT-licensed.

## Step 1 — GitHub repo (org already exists)

- [ ] Create repo `dilix-ai/rent-control-engine` → **Public**, no README/license/.gitignore (we have all three).
- [ ] In repo Settings → enable Issues, Discussions, Projects.
- [ ] In repo Settings → Pages → keep disabled (we don't need it).
- [ ] In repo Settings → Branches → add a branch protection rule on `main` (after first push):
  - Require PR before merging
  - Require status checks (`test (18)`, `test (20)`, `test (22)`)
  - Allow force pushes from admins only

## Step 2 — Push the repo

```bash
cd ~/dilix-rent-control-engine
git remote add origin git@github.com:dilix-ai/rent-control-engine.git
git push -u origin main
```

Verify on github.com:
- [ ] README renders with the badges
- [ ] CI runs on the push (Actions tab → green)
- [ ] License recognized as MIT (right sidebar)

## Step 3 — Verify package.json points at the right org — DONE

- [x] `repository.url`, `bugs.url`, README badge, SECURITY/CONTRIBUTING all updated to `dilix-ai/rent-control-engine` in the same commit as the remote add (2026-05-03).

## Step 4 — Claim the npm scope

```bash
npm login                              # interactive
npm whoami                             # confirm
npm publish --access public --dry-run  # see what would publish
npm publish --access public            # for real
```

Verify:
- [ ] https://www.npmjs.com/package/@dilix/rent-control-engine renders
- [ ] `npm view @dilix/rent-control-engine version` returns 0.1.0
- [ ] In a fresh dir: `npm install @dilix/rent-control-engine` works

## Step 5 — Tag the release on GitHub

```bash
git tag -a v0.1.0 -m "v0.1.0 — Initial public release"
git push origin v0.1.0
```

Then on GitHub → Releases → Draft a new release:
- Tag: `v0.1.0`
- Title: `v0.1.0 — Initial public release`
- Body: paste from CHANGELOG.md
- Mark as latest release

## Step 6 — Cross-link in the main Dilix product

In `~/ot-dealanalysis`:
- [ ] Update any references from `erica-ownershiptheory/dilix-rent-control-engine` → `dilix-ai/rent-control-engine` (grep the repo first to find them all)
- [ ] Update `docs/OPEN-SOURCE-STRATEGY.md` references

In `~/dilix-mcp`:
- [ ] Update package.json `repository.url` to point at the new MCP repo URL (when MCP also goes public)

## Step 7 — Announce

Order matters — Show HN drives the most traffic, post during US-morning EST for highest visibility:

1. **Show HN** — see [`docs/launch-posts.md`](./launch-posts.md) for the draft.
2. **LinkedIn** — Erica founder voice. See draft.
3. **Twitter/X thread** — 4-5 tweets with the Oakland 0.8% example as the hook.
4. **Substack briefing** — long-form essay on why open-sourcing the engine is a moat, not a giveaway.
5. **Reddit** — r/realestateinvesting (rules permitting) + r/CommercialRealEstate.
6. **Email blast** — to the briefing subscriber list.

## Step 8 — Post-launch monitoring (first 48h)

- [ ] Watch GitHub Issues tab for data corrections — first PR shipped within 48h is a strong signal.
- [ ] Watch npm download stats — https://npmtrends.com/@dilix/rent-control-engine
- [ ] Reply to every comment on Show HN within 4 hours (HN ranks engagement).
- [ ] If Show HN trends → cross-post to Lobste.rs.

## Rollback plan (if something is wrong)

If a critical bug surfaces in v0.1.0:

```bash
# Patch + ship 0.1.1
npm version patch
git push origin main --follow-tags
npm publish --access public
```

If it's bad enough to deprecate v0.1.0:

```bash
npm deprecate @dilix/rent-control-engine@0.1.0 "v0.1.0 contained a bug — upgrade to v0.1.1"
```

Don't unpublish. npm doesn't allow it after 24h, and even before that, unpublishing breaks downstream installs. Always patch-forward.

## What is NOT shipping in v0.1.0

(Set expectations in the launch post.)

- NY rent stabilization
- Santa Monica $-cap (only %-cap modeled)
- Unincorporated LA County sub-tiers (general tier only)
- Year-only `builtBefore` matching (~5% of borderline-year buildings off)
- Live BLS CPI pulls (back-calculated from CAA chart for v0.1)

All listed in README's "Limitations and known gaps" section.
