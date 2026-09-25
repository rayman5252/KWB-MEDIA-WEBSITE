# KWB Media Blog: Style Guide + Robot Instructions

Read this whole file before writing a post. It is the rulebook for every blog post on kwbmedia.com, whether a human or the scheduled blog robot writes it.

## Who's talking

- **Author:** Ray Wolters ("Big Ray"), founder of KWB Media LLC. 50 years old, decades in video production and marketing.
- **Voice:** first person, conversational, funny. Ray works hard and plays hard. Think "veteran pro who's seen it all, telling you the truth over a beer," not "corporate marketing copy."
- **Humor:** at least a few real laughs per post: self-deprecating, observational, a little sarcastic. Keep it clean and business-safe. No drug, political or religious jokes. No jokes that punch down.
- **Audience:** small and mid-sized business owners and marketing people. Plain English. Explain jargon or skip it.

## What KWB does (keep this current)

KWB is broadening beyond video. When a post mentions what KWB does, reflect the full range, never "video is all we do":
- Video production (on-location shoots in the Northeast; editing and post for anyone, anywhere)
- **Social media management**, including graphics
- **AI video** and AI stories/animation
- Marketing strategy and content

## Topics (the three lanes)

Rotate between these so posts don't cluster:

1. **Marketing:** straight talk for business owners (budgets, social, getting found, what actually works).
2. **Video:** production tips, planning a shoot, being on camera, drones, events, trade shows, short-form, testimonials.
3. **AI:** how AI helps (and doesn't) in marketing and video; practical, honest, from someone actually using it.

Check the existing posts in `tools/blog/posts/` first. Don't repeat a topic or angle that's already covered. Tie back to a KWB service where it fits naturally (see the list above, `services.html` and `specials.html`).

## Hard rules

- **Geography:** mention "the Northeast" ONLY when talking about KWB shooting/producing video. KWB helps people everywhere with everything else (marketing, AI, editing, animation). **Never name specific cities** (Hartford, Boston, Springfield, New Haven, etc.) in blog posts.
- **Stats and research:** use real, current, checkable numbers from reputable sources, and link them in the post's `sources`. Then **rewrite everything in Ray's voice.** Never paste a vendor's marketing language.
- **No sounding sponsored:** product and company names are OK when useful, but don't gush or list features like an ad. Say what it does for the reader in plain words.
- **No made-up stories:** don't invent specific anecdotes, clients, numbers or events and present them as Ray's real experience. General observations ("I've seen it a hundred times") are fine. Never name clients unless they're already named on the site.
- **Date:** the post's `date` and `modified` are the day it's published (today). No backdating.
- **Length:** about 800–1,400 words. Short paragraphs, `<h2>` subheads, lists where they help.
- **Ending:** close with a short pitch that links to `/services.html`, plus one of `/videos.html`, `/specials.html` or another blog post, then a funny last line.

## Header photo (pick in this order)

1. **Ray's photos first.** Look at the photos in `BLOG PHOTOS/` (new library) and `images/` (site photos). Open and actually look at them. Pick the one that best fits the topic.
   - Skip anything already listed in `tools/blog/used_photos.txt` unless every photo has been used.
   - Skip logos, icons, favicons, banners and the book cover.
   - Prefer horizontal photos. Don't use a photo of kids for a jokey topic.
   - **Never name or identify people in photos** (not even Ray) in the alt text or the post. Describe what's happening instead, e.g. "KWB Media editor at the edit suite".
   - Make the web copy: `python3 tools/blog/prep_photo.py "<source photo>" images/blog/<slug>.jpg`
2. **If nothing fits,** make a branded title card:
   `python3 tools/blog/title_card.py "<Post Title>" images/blog/<slug>.jpg`
3. Add the source photo path (or `title-card`) to `tools/blog/used_photos.txt`.
4. In the post JSON, `image` is the path relative to `images/`, e.g. `blog/<slug>.jpg`, and `image_alt` describes the photo.

## Post file format

One JSON file per post: `tools/blog/posts/<YYYY-MM-DD>-<slug>.json`. Copy an existing one as a template. Fields:

- `slug`: short, lowercase, hyphens, no year (e.g. `drone-video-for-business`)
- `title`: the headline
- `seo_title`: under ~60 characters, ends with ` | KWB Media`
- `description`: 140–160 characters, what the post is about (for Google)
- `card_text`: one or two punchy sentences for the blog card
- `date`, `modified`: today, `YYYY-MM-DD`
- `image`, `image_alt`: see above
- `sources`: list of `{"name": ..., "url": ...}`
- `body_html`: the post body as HTML (`<p>`, `<h2>`, `<ul>/<ol>`, `<strong>`, `<em>`, links). Available styles: `<div class="stat-box">` for a highlighted stat. Internal links start with `/`. External links get `target="_blank" rel="noopener"`. Use `&rsquo;` or plain apostrophes; no smart-quote issues in JSON.

Then run `python3 tools/blog/build.py`. It regenerates the post page, the blog page, the homepage cards and the sitemap. Never hand-edit the generated `blog/` HTML.

## The scheduled robot's workflow (approval required)

1. Clone/pull the latest `main`. Read this guide.
2. **If a branch named `claude/draft` already exists on GitHub, a draft is still waiting for Ray.** Don't write a new post or touch that branch. Just remind Ray there's a draft waiting at the preview link below, and stop.
3. Pick a topic (see lanes above), research it on the web, write the post JSON, pick/make the header image, run the build.
4. Check the result: serve the repo locally, open the new post in a headless browser, make sure there are no broken images or links, and read it once more for voice and facts.
5. Commit to a branch named exactly **`claude/draft`** and push it. **Do NOT push to `main`.** Vercel automatically builds the preview, always at the same address:
   `https://kwb-media-website-git-claude-draft-kwb5252.vercel.app/blog/<slug>/`
   (It takes a minute or two after the push. Ray must be signed in to Vercel to view previews.)
6. Tell Ray: the title, a 3-sentence summary, the preview link, the header image used, and the sources. Ask him to reply **"publish"** or with changes.
7. **Only after Ray says publish:** merge `claude/draft` into `main`, push `main`, then delete the `claude/draft` branch on GitHub (`git push origin --delete claude/draft`). Tell him the live link `https://www.kwbmedia.com/blog/<slug>/` (live about a minute after the push).
8. If Ray asks for changes, make them on `claude/draft`, push, and send the preview link again.
