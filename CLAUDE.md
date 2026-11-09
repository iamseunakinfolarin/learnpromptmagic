# Prompt Magic

You are the build agent for this repository. You write, run, and test the code.

Prompt Magic is a free, gamified website that teaches prompting through a kitchen theme. The AI is a kitchen assistant that cooks exactly what the order says. Learners rise from Prep Cook to Sous Chef to Head Chef, and a Kitchen Safety line teaches AI security. It is built for young people and open to everyone.

## Where the truth lives

- `docs/briefs/phase-N.md`: the scope of the current phase. Build only what the current brief asks.
- `docs/content-model.md`: the content contract: file layout, types, checks, and the progress store.
- `docs/prototype.html`: the visual and copy reference. Match its look, components, and voice. Its lists of stations are out of date, so take content from `content/`. Never edit, import, or serve this file.

## How to work

1. Start every phase by proposing a plan, then wait for approval before writing application code.
2. Stay inside the phase's scope. List anything extra as a suggestion instead of building it.
3. Before saying a phase is done, run `npm run check:content`, `npm run lint`, `npm run test`, and `npm run build`. All must pass.
4. Commit in small steps with clear messages. Push your branch to GitHub before you finish and confirm it reached the remote. Never leave work only in the session.

## Stack

- Next.js (App Router), React, TypeScript in strict mode, Tailwind CSS, npm.
- Zod for content schemas, Vitest for tests, tsx to run TypeScript scripts.
- Fonts through `next/font`, bundled at build time: Shrikhand (display), Atkinson Hyperlegible (body), IBM Plex Mono (utility).
- Hosted on Vercel, deployed from this GitHub repository.
- Release 1 has no database, sign-in, analytics, API routes, server actions, or third-party scripts. Every page is statically rendered.

## Folders

- `app/` routes, `components/` UI, `lib/` logic (content loading, progress, scoring), `content/` JSON, `scripts/` checks and content tools, `tests/` tests.
- Test fixtures live in `tests/fixtures/`, never in `content/`.

## Content

- All lesson text lives in `content/` as JSON. Never hard-code lesson content in components.
- IDs are permanent. Never rename or reuse one.
- Edit files in `content/` only when the brief says to. If a check shows a content file is wrong, stop and ask.

## Design

- Colors are CSS variables taken from the `:root` tokens in `docs/prototype.html`. Dark mode redefines the variables under `prefers-color-scheme: dark`. No raw hex values in components and no Tailwind `dark:` variants.
- Reuse the prototype's components: order tickets on a steel rail, ingredient knobs, stars, pills, notes, recipe cards, and the chalkboard Daily Special.

## Words

- Never use these anywhere, including code comments and identifiers: spell, spells, wizard, wizards, witch, witches, witchcraft, sorcerer, sorcery, familiar, summon, conjure, enchant, enchanted, enchanting, potion, potions, hex, curse, cursed, grimoire, ritual, rituals, magical, magician.
- "Magic" appears only in the name Prompt Magic and the tagline "The magic is in how you ask."
- Tone: playful and warm, never babyish. Short sentences.
- The kitchen assistant is a tool, never a friend. No "AI buddy" language and no claims of feelings.
- Food in examples skips pork and alcohol. Examples avoid religious and political topics and use names and places from many regions.

## Privacy and safety

- No accounts, cookies, ads, trackers, or third-party scripts. Nothing a learner does leaves their device.
- Progress lives only in `localStorage` under `pm:progress:v1`, read and written only through `lib/progress.ts`, always inside try/catch.
- No free-text input in Release 1. No links to AI chat products.
- Kitchen Safety teaches defense. Practice attacks target only our own practice kitchen, never real sites, apps, or accounts. Advice about scams and deepfakes names its source and carries a last-verified date.

## Accessibility

- WCAG 2.2 AA: full keyboard play, visible focus, tap targets of at least 44px, body text of at least 16px, reduced motion when the device asks for it, and stars always paired with text.

## Secrets

- Release 1 uses no environment variables. Never commit `.env` files.
- Phase 4 adds one development-only API key. Its exact name is set in that phase's brief.
