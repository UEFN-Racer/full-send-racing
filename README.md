# Full Send Racing

Independent Fortnite racing island by **dawman89**. Island code: `0400-9013-9315`.

- Website: https://uefn-racer.github.io/full-send-racing/
- Track directory: https://uefn-racer.github.io/full-send-racing/tracks/
- Updates: https://uefn-racer.github.io/full-send-racing/updates/
- Play: https://www.fortnite.com/@dawman89/0400-9013-9315
- Community: https://discord.gg/Y7uBCfhr4U

## Analytics architecture

The public site preserves GitHub Pages hosting. `worker/index.js` is a separate Cloudflare Worker planned for scheduled collection from Epic's public Fortnite Data API. D1 schema and Wrangler config are in this repository. Configure a D1 database ID and an `ADMIN_TOKEN` secret before deploying the Worker. The dashboard under `/dashboard/` is not indexed and requires the Worker URL and token at use time. Do not put credentials in this repository.

Epic API reference: https://api.fortnite.com/ecosystem/v1/docs/
Epic API overview: https://dev.epicgames.com/documentation/en-us/fortnite/using-fortnite-data-api-in-fortnite
Creator Portal reports (Owner/Admin): https://dev.epicgames.com/documentation/fortnite/reports-in-fortnite

The track event import expects actual CSV columns `track,event_type,occurred_at` with optional mode/session/checkpoint/duration. Public island metrics contain no track-level outcomes. Import only a Creator Portal or otherwise approved export that really contains these columns.

The current website displays no live or historical metrics until verified Epic responses have been collected. Vipers Run and Submersion are listed with availability unconfirmed.

Full Send Racing is independent and is not affiliated with or endorsed by Epic Games.
