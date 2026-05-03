# Changelog

All notable changes to `@dilix/rent-control-engine` will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-05-03

### Added

- Initial public release
- 32 California rent control jurisdictions encoded from the California
  Apartment Association "Local Rent Control Ordinances" chart (updated
  1/2026):
  - **Active:** Alameda, Antioch, Baldwin Park, Bell Gardens, Berkeley,
    Beverly Hills, Commerce, Concord, Cudahy, Culver City, East Palo
    Alto, Gardena, Half Moon Bay, Hayward, Huntington Park, Inglewood,
    Larkspur, Los Angeles (City), Los Angeles (Unincorporated County),
    Los Gatos, Maywood, Mountain View, Oakland, Ojai, Oxnard, Palm
    Springs, Pasadena, Pomona, Richmond, Sacramento, San Francisco,
    San Jose, Santa Ana, Santa Monica, Thousand Oaks, West Hollywood
  - **Paused / repealed:** Salinas, Fairfax, San Anselmo (resolver
    falls through to AB-1482)
- AB-1482 California statewide rule (5% + regional CPI, max 10%)
- Costa-Hawkins single-family/condo exemption logic (Civ. Code §1954.52)
- 8 cap-formula variants supported as a discriminated union:
  `fixed_pct`, `cpi_formula`, `flat_plus_cpi`, `published_periods`,
  `unit_count_tiered`, `rent_base_tiered`, `binding_arbitration`,
  `not_in_effect`
- BLS regional CPI back-calculated from CAA chart values for internal
  consistency (SF-Oakland-Hayward, SF-Oakland-San-Jose,
  LA-Long-Beach-Anaheim, LA-Riverside-Orange, Riverside-SB-Ontario,
  San-Diego-Carlsbad, California-All-Items, West-Region-A)
- `resolveRentCap(property, asOfDate)` — main resolver
- `projectRentCapImpact(property, baseGri, holdYears, marketGrowthPct, asOfDate)` —
  multi-year NOI projection helper
- `findOrdinance(jurisdiction)` — lookup by jurisdiction string
- `getCPIReading(region, asOfDate)` and `getCPIRegionForCounty(county)`
  for CPI helpers
- 37 tests covering every formula variant, edge case, and Erica's
  reference data points (San Mateo 6.3%, Oakland 0.8% current period,
  San Francisco 1.4% current period)

### Known limitations

- **California only.** Out-of-state properties return
  `no_local_rule_no_ab1482`. NY/NJ/DC/OR/MN/MD coverage on roadmap.
- **Year-only date matching for `builtBefore`.** A 1979 build before
  6/13/79 should be SF-covered but is currently flagged exempt by the
  year cutoff. ~5% of borderline-year buildings affected.
- **Santa Monica $-cap not modeled.** Santa Monica caps the absolute
  monthly increase ($60-$76 by period) in addition to the % cap.
  Only the % is computed. High-end rents may be more constrained by
  the dollar cap.
- **Unincorporated LA County sub-tiers.** General tier resolved;
  small-property-landlord (+1%) and luxury-unit (+2%) sub-tiers require
  property metadata not yet exposed.
