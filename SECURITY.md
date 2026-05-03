# Security policy

## Reporting a vulnerability

If you discover a security issue in `@dilix/rent-control-engine`,
please **do not** open a public issue. Email **ops@dilix.ai** with:

- A description of the vulnerability
- Steps to reproduce
- Affected versions
- Your assessment of impact

We aim to respond within **48 hours** and will work with you on a
disclosure timeline. Responsible disclosure is appreciated; we credit
researchers in CHANGELOG.md unless you prefer to remain anonymous.

## Supported versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | ✅ Yes — actively  |

## Security considerations specific to this package

This package contains regulatory data and computation logic only — no
network calls, no credentials, no user input parsing beyond simple
typed inputs. The most likely security concern is **incorrect data**
producing wrong cap percentages used in financial decisions. Report
those via the [Data correction template](https://github.com/erica-ownershiptheory/dilix-rent-control-engine/issues/new?template=data_correction.yml),
not via this security channel.
