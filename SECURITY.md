# Security Policy

## Supported Versions

| Version      | Supported |
| ------------ | --------- |
| 1.0.0-rc.1   | ✅        |
| < 1.0.0-rc.1 | ❌        |

## Reporting a Vulnerability

Do NOT open a public GitHub issue for security vulnerabilities.

Report vulnerabilities privately to: security@vhyxara.com
(placeholder — update before public launch)

Include in your report:

- Description of the vulnerability
- Steps to reproduce
- Affected package(s) and version(s)
- Potential impact assessment

## Response Timeline

- Acknowledgement: within 48 hours
- Status update: within 7 days
- Patch release: within 14 days for critical issues

## Scope

In scope:

- Manifest signing and HMAC verification
- Action token generation and verification
- Domain verification token handling
- Injection detection in contract fields
- Key management infrastructure

Out of scope:

- Security of the application consuming VhyxSeal
- Third-party dependencies
- Issues in alpha/deprecated versions

## Alpha Security Status

VhyxSeal 1.0.0-rc.1 implements HMAC-SHA256 manifest signing
and cryptographic action tokens. Key management infrastructure
and domain verification are in active development.
See README for current security status.
