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
  - `ww2-hex/` — Landfall: WWII (territory-and-sea-zone world strategy modeled on Ray's Realm; no save or online play)
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
- Last work (Nov 27): Ray's Realm — fifth army, the Dwarves (Stonehold Clans, team 5): Crossbowmen, Steam Tank (18g), stone walls only siege units break, mountain climbing, forts 18g (walls are drawn in code, `drawWall`, so neighbours join up; stone faces from `assets/wall_stone.webp`), own research and art. Ships (all armies): archers/crossbows/rangers shoot from aboard and all return fire on any attacker; "Unload all" button. Battles stay four armies max, enemies drawn at random. AI never keeps archers aboard on purpose. Dwarves then boosted (Nov 27): Steam Tank move 3, Dwarf Warrior/Mercenary 14 HP, Crossbowman 10 HP, +1 gold a turn (`FACTIONS[5].base` 3). Computer-only games, random corners, even share 25%: before the boost Dwarves won about 11%, after it 21% (200 games, Dwarves in every game); Dark Host 42%, Valkyries 39%, Order and Emerald about 12% each. AI walls made no measurable difference; AI uses walls and mountains poorly. Map corner matters a lot (earlier 300 games: bottom-left won 44%, top-right 11%). Pushed Nov 27; nothing half-done.
- Ray's Realm team gotcha: army ids are `ARMY_IDS` [0,1,2,3,5]; 4 is the barbarians and the "abandoned keep" marker. `keepOwner`/`seenKeep` are per map corner, not per army. Use `isArmy(t)`, never `t<4`.
- Last work (Nov 26): Landfall factories — troops are produced only where there is a factory (every capital plus one more per nation, `SECOND_FACTORY`); a factory can be bought on any owned territory for `FACTORY_COST` (15), makes `NEW_FACTORY_LIMIT` (2) a turn from the next turn; captured factories idle until the captor's next turn. Art `assets/factory.webp` (PNG in art-source), made with FAL nano-banana. Each factory is drawn on its own territory (`factorySpot`), placed clear of unit stacks (its own and neighbours') and the name; a few crowded random-map territories still overlap.
- Last work (Nov 25): Landfall — units now move and attack by click-and-drag; a plain click only selects (or places a new ship). While dragging, the starting piece is greyed and an arrow runs to the pointer. The cursor is a pointing finger over your pieces and an open hand over the map. Unit bases are painted in the nation colour in code (`baseArt`; art files unchanged), and the UK colour is now brown. Borders, ownership/fog tints and highlights are now smooth vector shapes (`traceBorders` in `assets/world.js`), drawn live so they stay sharp when zoomed; clicks still use the cell raster. Unit stacks no longer get cut off at the map seam (`draw()` renders layer by layer across the wrapped copies) and sit farther from the top and bottom edges (anchor choice in `assets/world.js`; a few very thin sea zones there are still tight). The nation you pick now moves first each round (others follow in the usual order), and AI turns play 30% slower (`AI_PACE`). Open question: AI animation still stops after a per-nation time budget (`AI_ANIM_BUDGET`), so in a test game over half of AI attacks resolved instantly.
- Terrain art gotcha: `t_*` tiles are saved as pointy-topped hexes and the game draws them turned 90° clockwise, so scenery must lie on its side (top pointing left) in the file. Gold/crystal mine, keep and fort tiles are drawn as saved.
- Pinned for later: military "Leader" units (Ray wants to think about it first).
