# Contributing to `@dilix/rent-control-engine`

Thanks for considering a contribution. This package powers underwriting
decisions for real CRE investments — accuracy is non-negotiable.

## What we welcome

- **Data corrections** — wrong ordinance, stale CPI reading, missing
  amendment. **Most valuable contribution.** Every accepted correction
  ships with the next release; contributors are credited in CHANGELOG.md.
- **New jurisdictions** — CA cities not yet in the CAA chart, or
  out-of-state ordinances (NY, NJ, OR, MD, DC).
- **New formula variants** — if a jurisdiction uses a cap structure not
  yet supported by `CapFormula`, propose the discriminated union variant.
- **Test coverage** — additional edge cases, regression tests for
  reported bugs.
- **Documentation** — clearer examples, better READMEs.

## How to contribute

### Data corrections

1. **Verify the issue against an authoritative source.** Acceptable
   sources: municipal code, official rent board publication, California
   Apartment Association chart, BLS regional CPI release.
2. Open an issue using the [Data correction template](https://github.com/dilix-ai/rent-control-engine/issues/new?template=data_correction.yml)
   first — let's confirm the correction is needed before you write code.
3. Open a PR referencing the issue.

### Code contributions

```bash
# Fork + clone
git clone https://github.com/<your-username>/dilix-rent-control-engine.git
cd dilix-rent-control-engine

# Install
npm install

# Run tests
npm test

# Type-check + build
npm run build
```

When making changes:
- **Tests are required** for any logic change. Add a case to
  `test/rentControl.test.ts` covering both the happy path and a
  regression case for the bug you're fixing.
- **Citations are required** for new jurisdictions and ordinance
  changes. Every `RentControlOrdinance` must have `citation` and
  `sourceUrl` fields populated with authoritative references.
- **Update CHANGELOG.md** under `[Unreleased]`.
- **Don't reformat unrelated code.** Keep PRs focused.

## How resolution decisions are made

This package is opinionated about precision over breadth. When in
doubt:

- Prefer documented, citation-backed values over plausible estimates.
- When CPI readings are unavailable, prefer an explicit `confidence: low`
  return with a `warnings` entry over silently using a stale value.
- When a property is borderline-eligible (e.g., built in the same year
  as the cutoff), surface the ambiguity in `warnings` rather than
  picking a side.

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Briefly: be kind,
disagree with respect, focus on the data and the math.

## License

By contributing, you agree your contribution is licensed under the
[MIT License](./LICENSE).

## Maintainers

- [Erica Walters](https://github.com/erica-ownershiptheory) ·
  [@dilix.ai](https://dilix.ai)
- ops@dilix.ai for security or licensing questions
