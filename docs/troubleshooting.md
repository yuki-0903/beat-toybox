# Troubleshooting

Common issues in this Next.js + Phaser project.

## Next Dev Missing Chunk

Symptoms:

```txt
Cannot find module './819.js'
Cannot find module './276.js'
GET /_next/static/... 404
```

This usually means the Next dev output is stale.

Fix:

1. Stop the dev server.
2. Delete `.next`.
3. Start dev again.

```bash
rm -rf .next
npm run dev -- -H 0.0.0.0 -p 3000
```

## Phone Cannot Open Localhost

Use the Mac LAN IP instead of `localhost`.

Start dev with:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

Then open:

```txt
http://<mac-lan-ip>:3000
```

Both devices must be on the same network.

## Phaser Must Stay Client-Side

Phaser depends on browser APIs.

Do not import Phaser into server components. Keep Phaser inside the client game bootstrapping path.

## Asset Missing

Run:

```bash
npm run validate:assets
```

If an asset key fails:

1. Check `game/config/themeAssets.ts`.
2. Check the file exists under `public/assets/themes/...`.
3. Check PNG/SVG extension matches the path.
4. Restart dev if the asset was just added.

## Ranking JSON

Local/server runtime rankings use:

```txt
app/api/rankings/route.ts
data/rankings.json
```

This is useful for local shared testing, but it is not a production database. A static export or GitHub Pages deployment cannot persist writes to this JSON file at runtime.

## Git Push Fails With HTTP 500

Large image asset pushes may fail with:

```txt
RPC failed; HTTP 500
send-pack: unexpected disconnect
```

Retry after setting:

```bash
git config http.postBuffer 524288000
git config http.version HTTP/1.1
git push
```

## Browser Audio Does Not Play

Audio must start after a user gesture. Enter gameplay from the menu before expecting BGM/SE to play.
