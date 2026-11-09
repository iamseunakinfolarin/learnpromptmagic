# Phase 1 brief: Foundation

## Goal

Set up the Prompt Magic website: the Next.js project, the kitchen design system, the home page, stub pages for every Release 1 route, a checked content layer, and the progress store. The games come in Phase 2.

## Before you write any code

1. Check the session and report what you find: `node --version`, `npm view next version` (this proves npm is reachable), `git remote -v`, and `git status`.
2. Read `CLAUDE.md`, `docs/content-model.md`, and `docs/prototype.html`.
3. Propose a plan and wait for my approval. The plan must cover the folder structure, every route, how the color tokens and fonts are carried over, the Zod schemas and content checks, the progress store, the tests, and how you will push the work.

## Starting point

- The repository already contains `CLAUDE.md`, `README.md`, `docs/`, and `content/`. Do not edit or move them. The one exception is `README.md`, which you may rewrite to describe the project.
- `create-next-app` refuses a folder that already has files. Scaffold into a temporary folder outside the repository, move the generated files in without overwriting anything listed above, then delete the temporary folder. If the scaffold creates its own `AGENTS.md` or `CLAUDE.md`, discard it.
- Use npm and the latest stable Next.js. Use whichever Node version it requires, and record it in `engines` in `package.json`.

## Environment variables

None. Do not create `.env` files. Make sure `.gitignore` covers `.env*`.

## Scope

### 1. Design system

- Copy every color token from the `:root` block in `docs/prototype.html` into `app/globals.css` as CSS variables. Light values go on `:root`, and dark values go under `@media (prefers-color-scheme: dark)`. Skip the prototype's `[data-theme]` blocks, which exist only for the preview viewer.
- Expose the tokens to Tailwind so classes such as `bg-paper`, `text-ink`, and `border-rule` resolve to the variables. Dark mode comes only from the variables, with no `dark:` variants.
- Load fonts with `next/font`: Shrikhand for display; Atkinson Hyperlegible for body text, at 400 and 700 plus italic 400; IBM Plex Mono for utility text, at 400, 500, and 600. They are bundled at build time, so no page asks Google for fonts while it runs.
- Build these components to match the prototype:
  - `SiteHeader`: the brand, nav links (Kitchen, Daily Special, Cookbook), and the stars and streak chips.
  - `SiteFooter`: links to About, Privacy, and Terms.
  - `Button`: primary and secondary.
  - `Ticket`: a paper order ticket hanging from a steel clip, with a zigzag bottom edge.
  - `Rail`, `Panel`, `Pill`, `Tag`.
  - `Stars`: always paired with text for screen readers.
  - `Note`: good, bad, and hint styles.
- Keep the tiled wall background, the 2px ink borders, and the type scale.

### 2. Routes (all statically rendered)

- `/` is the home page, built to match the prototype's home view:
  - The hero with the wordmark, tagline, lede, both buttons, and the fine print. "I'm new: start cooking" links to `/kitchen/the-order`. "I use AI often" links to `/kitchen` for now.
  - The lunch demo with the "Add the details" toggle, using `content/home-demo.json`.
  - "Meet your kitchen assistant" with the stand mixer drawing and the three traits.
  - One card per line from `content/lines.json`, in line order, each with its recipe count from `content/recipes.json`. Release 2 lines get a "Coming soon" tag.
- `/kitchen` is a stub. It lists every recipe grouped by line in line order, and each Release 1 recipe links to its station. Plain styling is fine; the full map arrives in Phase 3.
- `/kitchen/[recipeId]` is one static page per Release 1 recipe, using `generateStaticParams` with `dynamicParams` set to false. Release 2 recipes get no page.
  - A ready recipe shows the "Order up" step: an eyebrow with the station label and technique, the name, `oneLine`, `quick`, and a "Go deeper" disclosure holding the `deeper` paragraphs.
  - A planned recipe shows its name and "This station is being written."
- `/daily` and `/cookbook` are stubs showing the page title in the display face and "Coming in Phase 3."
- `/about`, `/privacy`, and `/terms` are stubs showing "Coming in Phase 5."
- The 404 page says "That's not on the menu." and has a button back to the kitchen.
- Every page has its own title and description. The home page title is "Prompt Magic".

### 3. Content layer

- `lib/content`: typed loaders for every file in `content/`, with Zod schemas that match `docs/content-model.md` exactly. Schemas are strict, so extra fields fail.
- `scripts/check-content.ts` runs as `npm run check:content` and as a `prebuild` script, so a Vercel build fails on bad content. It enforces every rule under "Checks" in `docs/content-model.md` and prints each failure with its file path and the reason.
- `npm run check:release` adds the release check from the same document. It is expected to fail until Phase 5, so do not run it in `prebuild`.

### 4. Progress store

- `lib/progress.ts` is the only module that touches `localStorage`. It uses the key `pm:progress:v1` and the shape in `docs/content-model.md`.
- Every read and write sits inside try/catch. If storage is unavailable, or the saved data is corrupt or from another version, fall back to a fresh state held in memory and set a flag the UI can use to show a notice.
- Functions: `load`, `save`, `recordChallenge` (keeps the best stars and counts attempts), `reset`, and `totalStars`.
- The header chips read the store after the page mounts, so there are no hydration warnings. In this phase they show 0 stars and a streak of 0.

### 5. Tests (Vitest)

- Combination keys and prompt assembly, following the rules in `docs/content-model.md`.
- The progress store: best stars kept, attempts counted, corrupt JSON gives a fresh state, and a `localStorage` that throws falls back to memory.
- Each content check fails on a small bad fixture in `tests/fixtures/`.

## Acceptance criteria

Verify all of these before you say the phase is done.

1. `npm run check:content`, `npm run lint`, `npm run test`, and `npm run build` all pass with zero errors.
2. The build output marks every route as static.
3. Show the checks working. Add the word "potion" to a content string and delete one Test Kitchen output, run `npm run check:content`, show both failures, then undo both changes.
4. If a headless browser is available, take screenshots of the home page at 1280px and 390px wide in light and dark mode, plus `/kitchen`, `/kitchen/the-order`, and the 404 page, and confirm nothing scrolls sideways at 360px. If no browser is available, say so, and I will check on the Vercel preview.
5. No console errors or hydration warnings appear, and no page makes requests to any host other than the site itself.
6. Push your branch to GitHub and confirm it is on the remote. Report the branch name and the last commit hash, and open a pull request into `main` if the session can. If it can't, say so and I will open it.

## When you finish

Write a short summary covering what you built, the result of each check, anything you could not verify, and any suggestions you did not build.
