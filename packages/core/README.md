# @vhyxseal/core

The zero-dependency foundation of the VhyxSeal semantic
contract layer. All other VhyxSeal packages build on this.

## What it provides

- Contract schema — ComponentContract, Condition, ErrorState,
  Relationship, Capability types
- Inference engine — inferContract() with five-level priority
  ordering from HTML semantics
- Security layer — injection detection, sanitization,
  HMAC-SHA256 manifest signing
- Manifest generator — generateManifest() with optional
  componentIds scoping (D4)
- Registries — relationship registry, capability registry,
  domain registry
- Versioning — version negotiation, version stages
- Action tokens — issueToken(), verifyToken(), revokeToken()
- Key management — registerKey(), rotateKey(), revokeKey()

## Installation

npm install @vhyxseal/core

## Zero dependencies

@vhyxseal/core has no runtime dependencies.
Node.js built-in crypto module is used for signing and
token generation.

## Alpha release

Key management infrastructure and domain verification
ship in Stage 4B. HMAC-SHA256 signing and action tokens
are implemented.

See the root README for full documentation and alpha
security status.
