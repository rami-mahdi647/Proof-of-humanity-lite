# Install (Self-host)

## Requirements
- Docker + Docker Compose (recommended)
- OR Node 18+ (manual)

## Docker (recommended)
1. Configure clients to send `x-license-key` on every request (except `/health`).
2. (Optional legacy fallback) set `LICENSE_KEY` in `docker-compose.yml` or `.env`.
3. Run:

```bash
docker compose up -d --build
```

Open:
- http://localhost:3000
- Health: http://localhost:3000/health

## Manual

```bash
npm install
# Recommended: clients send x-license-key per request
# Optional legacy fallback:
export LICENSE_KEY="POH-ABCD-1234-Z9Y8"
npm start
```

## Authentication contract
- Required per request: header `x-license-key`
- Optional fallback: query param `license_key`
- Optional legacy fallback: env `LICENSE_KEY`

## Configuration
- `LICENSE_KEY` (optional, legacy fallback only)
- `PORT` (optional)

## License file hot reload (optional)
- You can add `licenses.json` at the project root to allow-list license keys.
- Supported formats:
  - `[
      "POH-ABCD-1234-Z9Y8"
    ]`
  - `{ "licenses": ["POH-ABCD-1234-Z9Y8"] }`
- The server hot-reloads `licenses.json` automatically (mtime/cache + periodic reload + file watcher), so no restart is required after edits.
