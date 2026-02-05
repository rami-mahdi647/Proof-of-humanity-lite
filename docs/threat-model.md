# Threat Model

## Goal
Increase cost of automation and reduce cheap Sybil behavior for wallet-facing actions.

## Non-goals
- Proving real-world identity
- Preventing all bots
- Global uniqueness (one human = one account)

## Attacker capabilities
- Can run headless browsers
- Can outsource to click-farms
- Can replay requests
- Can attempt flooding / DoS
- Can solve prompts using LLMs (partially)

## Defenses (MVP)
- rate limiting per IP hint
- input constraints (length, timing)
- per-proof nonce + timestamp
- public hash for audit trail

## Known weaknesses
- Sophisticated bots can still pass
- Human farms can pass
- Without wallet signatures, proofs are not bound to a wallet identity

## Roadmap defenses
- optional wallet signature binding (EVM / BTC message)
- rotating prompt pools + prompt entropy
- proof-of-time (min time spent)
- challenge types: image choice / micro tasks
- allowlist rules per integrator
