# KWB Media website (kwbmedia.com)

Ray Wolters' ("Big Ray") business site for KWB Media LLC: video production, social media management, AI video, marketing. Also hosts his browser games and his Author's Corner.

## How it's built and hosted
- Plain static HTML/CSS/JS. No framework, no build step for the site itself. Shared styles in `styles.css`.
- Hosted on **Vercel**; the kwbmedia.com domain (registered at GoDaddy) points to it. Every push to `main` deploys to production.
- Redirects live in `vercel.json` (old GoDaddy URLs like `/about-us` → `about.html`). Add one when you add a top-level page that needs a clean URL.
- `.vercelignore` keeps `tools/`, `BLOG PHOTOS/` and `art-source/` in GitHub but off the live site.
- Ray hit his Vercel plan limit and isn't upgrading yet: keep things lean. No big uploads, no unnecessary deploys, no new Vercel projects without asking.

## Layout
- Top-level pages: `index.html`, `about.html`, `services.html`, `videos.html`, `specials.html`, `contact.html`, `authors-corner.html` (hub for his books, pen name Raymond W. Wolters), `video-production-hartford-ct.html`, `ai-game-fun.html` (games index).
- Games, each a self-contained folder with `index.html` + `assets/`:
  - `brand-fighter/` — Brand Fighter: Slop Strikes Back (arcade brawler; Ray calls it "the street fighter game")
  - `rays-realm/` — Ray's Realm (fantasy hex strategy)
  - `ww2-hex/` — Landfall: WWII (hex strategy modeled on Ray's Realm)
  - `over-the-marne/` — Over the Marne (2D WWI biplanes)
  - `skull-cove-kart/` — Skull Cove Kart (racing)
  - `dead-air/` — Dead Air (first-person zombie shooter)
- **Brand Fighter always stays first on `ai-game-fun.html`.** New games go after it.
- Game art: full-size PNG originals in `art-source/<game>/`; the games load WebP copies from `<game>/assets/`. Change a sprite by editing the PNG, then export a same-size WebP (~quality 90) into `assets/`.

## Blog
- Posts are JSON in `tools/blog/posts/`. Never hand-edit `blog/*/index.html`.
- Build with `python3 tools/blog/build.py`. It regenerates the post pages, `blog/index.html`, the "From the Blog" cards on the homepage and the sitemap entries.
- **Read `tools/blog/STYLE_GUIDE.md` before writing any post.** Short version: Ray's voice, first person, funny, plain English; lanes are marketing, video, AI. Only say "the Northeast" for on-location video work.
- Ray's own photos go in `BLOG PHOTOS/`. Posts need his approval before publishing.

## Client names
Special Olympics and United Way can be named as clients. Do **not** name Electric Boat / General Dynamics or Mitsubishi anywhere on the site.

## Standing order: keep this file current (Ray asked for this permanently)
- Whenever you commit work in this repo, update the "Current state / where we left off" section below **in the same commit**: what changed, what's half-done, what's next. Don't wait to be asked.
- If anything above goes stale (new page, new game, hosting change, new gotcha), fix it in that commit too.
- Keep the "where we left off" section to the last few sessions; trim older lines so the file stays short.
- Ray works on two computers. At the start of a session, `git pull` before touching anything; push when done.

## Current state / where we left off
- Last work (Nov 24): Ray's Realm — Scriptorium and research, mana crystal mines, Wizard spells, Dirigible, 3D gold mine, Hydra/hills/Paladin tweaks.
