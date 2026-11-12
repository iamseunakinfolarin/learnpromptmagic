# Prompt Magic

A free, gamified website that teaches people to write better prompts for AI, built around a kitchen. The AI is a kitchen assistant that cooks exactly what the order says, and learners rise from Prep Cook to Head Chef.

The magic is in how you ask.

## Running it

Node 20.9 or newer, and npm.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build. Runs the content check first, so bad content fails the build |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run check:content` | Checks everything in `content/` against the content model |
| `npm run check:release` | The content check plus the launch rules. Expected to fail until the launch phase |

## How it is built

- Next.js (App Router) with React and TypeScript in strict mode, styled with Tailwind CSS.
- Every page is statically rendered. Release 1 has no database, no sign-in, no analytics, no API routes, and no third-party scripts.
- Colors are CSS variables taken from the prototype. Dark mode redefines the variables, so there are no `dark:` variants in components.
- Fonts are bundled at build time with `next/font`, so no page asks another host for anything.
- Lesson content lives in `content/` as JSON, loaded through typed Zod schemas.
- Progress lives only in `localStorage`, under `pm:progress:v1`, read and written only through `lib/progress.ts`. Nothing a learner does leaves their device.
- Hosted on Vercel, deployed from this repository.

## What's here

- `app/`: routes. `components/`: UI. `lib/`: content loading and the progress store.
- `scripts/`: the content and release checks. `tests/`: Vitest tests and their fixtures.
- `content/`: the lesson content as JSON.
- `CLAUDE.md`: rules Claude Code follows in every session.
- `docs/briefs/`: one brief per build phase. Start a phase by asking Claude to read its brief.
- `docs/content-model.md`: how the lesson content is structured and checked.
- `docs/prototype.html`: the approved design prototype. Open it in a browser to play the first station.

## Build status

Phases 1 to 3 are built: the foundation, the four game modes, and now progression. The kitchen map shows ranks and what is open, locked, or finished. Passing the Skip-ahead test or finishing Prep Cook opens Sous Chef and Kitchen Safety. The Daily Special, the Cookbook with Off the Menu, and Start over are in.

Not done yet: the About, Privacy, and Terms pages, and live model outputs. Every challenge output is still hand-written and labelled `sample`, so `npm run check:release` fails until Phase 4 replaces them.
