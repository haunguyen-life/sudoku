# Mini Sudoku Sillyville

A single-page 6x6 sudoku with 200 levels. Progress saves in each browser.

## Project layout

```
sudoku/
├── index.html    # The game UI (HTML, CSS and JS in one file)
├── api/
│   └── leaderboard.js # Vercel Function backed by Upstash Redis
├── tests/
│   └── leaderboard.test.js # API tests using Node's built-in test runner
├── .env.example  # Required database environment variable names
├── vercel.json   # Vercel settings: clean URLs and basic security headers
├── .gitignore
└── README.md
```

There is no build step or npm dependency. Vercel serves `index.html` and runs the leaderboard API as a Node.js Function.

## Deploy to Vercel

### Option A: Import from GitHub (recommended)

1. Push this folder to `haunguyen-life/sudoku` on GitHub.
2. Go to https://vercel.com/new and sign in with your account.
3. Choose **Import** next to the `sudoku` repository. If it's missing, click **Adjust GitHub App Permissions** and grant access.
4. Keep the defaults:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** leave empty
   - **Output Directory:** leave empty
5. Connect a database using the instructions below, then click **Deploy**. Every later push to `main` redeploys automatically.

### Option B: Vercel CLI from your computer

```bash
npm i -g vercel
cd D:\Projects\2026\sudoku
vercel login
vercel          # first time: answer the prompts, accept the defaults
vercel --prod   # publish to production
```

## Connect the shared leaderboard

The original leaderboard depended on Claude's artifact database (`window.claude`), which is not available on Vercel. The game now uses the same-origin `/api/leaderboard` Function with persistent Upstash Redis storage.

1. In the Vercel project, open **Storage / Marketplace** and add **Upstash Redis**.
2. Connect the database to this project and enable the environment(s) you deploy to (Production and, if needed, Preview).
3. Check **Settings > Environment Variables** for `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Use the **read-write REST token**, not a read-only token. The API also supports `KV_REST_API_URL` and `KV_REST_API_TOKEN` if the integration creates those names instead.
4. **Redeploy** after connecting the database or changing variables. Existing deployments do not receive new variables automatically.
5. Open the game, clear a level, and visit **Legends**. Returning players' locally saved cleared levels also sync when the page loads.

Keep tokens server-side; never put them in `index.html` or commit `.env.local`. If the database is missing or unavailable, Legends shows an explicit connection message instead of pretending the leaderboard is empty. Gameplay and local progress continue to work.

### Behavior and limits

- Rankings contain the top 100 players with at least one cleared level, ordered by highest cleared level. Equal scores use Redis's reverse ID ordering.
- Rankings refresh on page load, when opening Legends, and after posting a score; they are not a live subscription.
- A signed, HTTP-only cookie identifies a browser. Names need not be unique. Different browsers/devices are separate players; clearing cookies creates a new identity. "Forget me on this device" resets local progress only, not the shared best score.
- Score updates are atomic and never lower a player's best level. Rotating the Redis token invalidates existing player cookies.
- Existing Claude-hosted leaderboard entries are not migrated. Browser progress is origin-specific, so a new Vercel domain does not automatically inherit progress from another domain.
- This is a casual leaderboard: scores originate in the browser, not server-verified puzzle completions. It is not suitable for prizes or competitive anti-cheat guarantees.
- Preview deployments connected to the same database share rankings with production. Use a separate database for isolated previews.

### Local development and tests

Copy `.env.example` to `.env.local`, fill in your database credentials, and run `vercel dev` to serve both the game and API. A plain static server cannot run the leaderboard Function.

Run API tests with Node.js 20 or newer (no database or dependencies required):

```powershell
node --test .\tests\leaderboard.test.js
```
