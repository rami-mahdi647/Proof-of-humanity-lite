# Integration Guide (Wallets)

## API
- `GET /api/prompt` → { prompt }
- `POST /api/prove` → { id, createdAt, hash, shareUrl }
- `GET /api/proof/:id` → proof payload

## Recommended usage
Use PoH Lite to gate:
- referral creation
- campaign claim attempts
- quest completions
- “new user” bonuses
- support ticket creation

Store either:
- `proof_id` (recommended)
or
- `hash`

## Commercial Use
Core is MIT for:
- personal / research / small non-custodial apps

If you are:
- custodial wallet / exchange
- or large-scale consumer app
- or need SLA / custom defenses / private prompt pools

We offer:
- commercial license
- private deployments
- integration support
- custom threat-model hardening

Contact: (add email)
Or open a GitHub issue titled: **Commercial use**
