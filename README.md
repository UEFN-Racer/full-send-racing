# Full Send Racing

Independent Fortnite racing island by dawman89. Island code: `0400-9013-9315`.

- Website: https://uefn-racer.github.io/full-send-racing/
- Track directory: https://uefn-racer.github.io/full-send-racing/tracks/
- Updates: https://uefn-racer.github.io/full-send-racing/updates/
- Fortnite listing: https://www.fortnite.com/@dawman89/0400-9013-9315
- Community: https://discord.gg/Y7uBCfhr4U

## Analytics service

The `worker/` directory contains a Cloudflare Worker for scheduled snapshots from the public Fortnite Data API. The D1 schema is in `migrations/`; Worker settings are in `wrangler.toml`.

Before deployment:

1. Create the D1 database and set its identifier in `wrangler.toml`.
2. Apply the migration.
3. Set `ADMIN_TOKEN` as a Worker secret.
4. Configure Cloudflare Access for administrative routes.

The Creator Portal CSV importer accepts rows with `track,event_type,occurred_at` and optional `mode,session_key,checkpoint_key,duration_ms`. It supports event types `vote`, `start`, `finish`, `dnf`, and `checkpoint`. Import only source files that contain these fields.

Epic public island metrics are aggregated and do not provide track-level outcomes or private Analytics-device events. The site displays metric values only after collection. Vipers Run and Submersion availability is unconfirmed.

Epic API reference: https://api.fortnite.com/ecosystem/v1/docs/
Creator Portal reports: https://dev.epicgames.com/documentation/fortnite/reports-in-fortnite

Full Send Racing is not affiliated with or endorsed by Epic Games.
