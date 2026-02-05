# Proof of Humanity (Lite)

Minimal, open human-verification primitive for crypto wallets.

**No KYC. No accounts. No tracking.**
Just proof-of-effort at a point in time.

## What it is
A tiny service that produces a **public proof** (timestamp + prompt + answer + hash) that a human likely interacted with your app.

This is not identity.
This is not reputation.
This is **liveness + human effort**.

## Why wallets use it
Wallets are getting hit by:
- airdrop farmers & Sybil swarms
- bot spam on referrals, campaigns, quests, support
- fake “new user” inflation

PoH Lite adds a cheap, privacy-preserving friction layer:
- stop obvious bots
- increase cost of Sybil
- keep UX fast

## Quick integration (wallets)
Your wallet calls:
1) `GET /api/prompt`
2) shows prompt UI
3) `POST /api/prove` → gets `proof_id` + `hash` + `share_url`
4) wallet stores `proof_id` or `hash` with the user action (campaign claim, referral, quest, etc.)

See: `docs/integration.md`

## Threat model & assumptions
We publish limitations and attack surfaces:
- `docs/threat-model.md`
- `docs/assumptions.md`


## Authentication contract
All protected endpoints require a license key **per request**:
- Required header: `x-license-key: POH-XXXX-XXXX-XXXX`
- Optional legacy fallback: query param `license_key`
- Optional legacy environment fallback: `LICENSE_KEY` (for old deployments only)

The server normalizes incoming keys with `trim().toUpperCase()` and validates format:
`^POH-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$`.

## Self-hosting
This project is designed to be:
- deployable in minutes
- auditable
- easy to fork

## License
Core is MIT (see `LICENSE`).
Commercial terms for custodial / large-scale use:
See `docs/integration.md`.

## Contact
If you are a wallet / exchange / app with large MAU:
Open an issue titled **"Commercial use"** or email: (verdant.helix@outlook.es)
