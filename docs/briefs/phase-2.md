# Phase 2 brief: The four game modes

## Goal

Make the stations playable. Build Test Kitchen, Kitchen Rescue, Guess the Recipe, and Health Inspector, wire them into the station flow, and award stars that persist. Progression, the kitchen map, and the Daily Special come in Phase 3.

## Before you write any code

1. Report the session state: `node --version`, `git remote -v`, `git status`, and the current branch.
2. Read `CLAUDE.md`, `docs/content-model.md`, and `docs/prototype.html`. The prototype implements all four modes already. Open it in a browser if you can, play Station 01 end to end, and match what it does.
3. Read the existing `lib/progress.ts`, `lib/content/`, and the four challenge files in `content/challenges/the-order/`.
4. Propose a plan and wait for my approval. The plan must cover: the scoring module and its rules, one section per game mode, how a station tracks steps and resumes, which components you reuse from Phase 1 against which you add, the keyboard and screen-reader behaviour, and your test list.

## Starting point

- Phase 1 is merged and live. Branch from `main`.
- `lib/progress.ts` already has `load`, `save`, `recordChallenge`, `reset`, `totalStars`, and a `stationSteps` map. Use them. Do not change the storage key or the saved shape.
- `lib/content/combos.ts` already assembles prompts and combination keys, and is tested. Use it rather than writing that logic again.
- `content/challenges/the-order/` holds one real example of each of the four types. Build against those. Do not add, rename, or edit content files in this phase.

## Environment variables

None. Do not create `.env` files.

## Scope

### 1. Scoring

- Add `lib/scoring.ts` as the only place star rules live. No component computes stars itself.
- The rules, one function per mode:
  - **Test Kitchen**: 3 if the first Serve is correct, 2 if the second is, 1 after that.
  - **Kitchen Rescue**: start at 3, lose 1 for each wrong pick across both steps, never below 1.
  - **Guess the Recipe**: 3 on the first try, 2 on the second, 1 after that.
  - **Health Inspector**: 3 if every problem is found with no false flags, 2 if there is exactly one slip (one missed problem or one false flag), 1 otherwise.
- Stars are always 1, 2, or 3. A challenge is only recorded once the learner has finished it correctly.
- On finishing, call `recordChallenge`, which already keeps the best result and counts attempts. Replaying a solved challenge never lowers the saved stars.

### 2. Test Kitchen

- Show the ticket (the order) above the workspace.
- Show the ingredients as switches, in file order, each with its label. Switching one recomputes the combination key and shows that key's pre-generated output. No network request, no delay.
- Show the assembled prompt and the output side by side, stacked below 900px.
- A Serve button submits. If the current combination is in `correctCombos`, the challenge is solved. If not, show that ingredient's `missingHint` for a missing ingredient, keep the learner on the challenge, and let them try again.
- After solving, show the `explanation`.

### 3. Kitchen Rescue

- Show `brokenPrompt` and `brokenOutput` together.
- Step 1: the diagnoses in file order, labelled A, B, C, D. A wrong pick shows `wrongDiagnosisHint` and stays on step 1. The right pick shows `rightDiagnosisNote` and moves to step 2.
- Step 2: the fixes in file order, labelled the same way. A wrong pick shows `wrongFixHint`. The right pick reveals `fixedOutput` beside `brokenOutput`, with `explanation` under it.

### 4. Guess the Recipe

- Show `output` first, then the four options in file order, labelled A to D.
- A wrong pick shows `wrongHint` and lets the learner pick again. Keep wrong options visibly struck through or marked, so nobody picks the same one twice by accident.
- The right pick shows `explanation`.

### 5. Health Inspector

- Show `setup` above the lines, and a **Practice** tag on the answer itself. The tag is required: these answers are written by hand, because models do not make mistakes on cue.
- Show each sentence as its own tappable target. Tapping marks it as flagged; tapping again unflags it. Nothing is revealed until the learner submits.
- A Submit button ends the round. Then show, for each sentence: whether it was a problem, its `note`, and a link to the recipe named in `preventedBy`. Mark the learner's false flags and anything missed.
- Phrase the result without scolding. "You missed one" and never "Wrong".

### 6. The station flow

- `/kitchen/[recipeId]` becomes a sequence of steps, built from `stationChallengeIds` in play order:
  1. **Order up**, which already exists: the intro, Quick, and Go deeper.
  2. The challenges, one per step, in order.
  3. **Plate up**: the station's stars, the `recipeCard` unlocked, and the `kitchenScience` card.
- Finishing a step advances to the next and writes the index to `stationSteps`.
- Re-entering a station resumes at the first unfinished step, and offers a way back to any earlier step.
- Replaying a finished challenge is allowed and keeps the best stars.
- All of this is client-side state on a statically rendered page. Do not add API routes, server actions, or dynamic rendering. The build must still mark every route static.

### 7. Two fixes carried over from Phase 1

- The header stars and streak lose their labels below 560px, so the streak reads as a bare number. Keep both readable on a phone without crowding the header, and make sure a screen reader always hears what each number means.
- `lib/progress.ts` already sets a flag when storage is unavailable. Surface it: if progress cannot be saved, show a quiet, non-blocking notice once, saying play still works but results will not be kept. Do not show it on every page.

### 8. Accessibility

- Every control is a real `button` or `input`, reachable and operable by keyboard, with a visible focus ring and a tap target of at least 44px.
- Correctness is never carried by colour alone. Pair every state with text or an icon.
- Announce results to screen readers with a polite live region, so solving a challenge is not silent.
- Respect `prefers-reduced-motion` on any reveal.
- No free-text input anywhere in Release 1.

### 9. Tests (Vitest)

- Each scoring rule, including the boundaries: Kitchen Rescue never drops below 1, Health Inspector's one-slip case counted both ways, and a replay keeping the better earlier score.
- The station step machine: advancing, resuming at the first unfinished step, and a finished station staying finished.
- Test Kitchen output selection: every combination key maps to the output the content gives, and `base` is never a correct answer.
- Keep the existing tests passing. Do not weaken a test to make new code pass.

## Out of scope

Say so and move on if you find yourself wanting to build: the kitchen map, ranks or unlock rules, the Skip-ahead test, the Cookbook, the Daily Special, Start over, Off the Menu, or anything in `app/about`, `app/privacy`, or `app/terms`. Those are Phase 3 and Phase 5.

## Acceptance criteria

Verify every one before you say the phase is done.

1. `npm run check:content`, `npm run lint`, `npm run test`, and `npx tsc --noEmit` all pass with zero errors.
2. `npm run build` passes and still marks every route as static.
3. Play Station 01 end to end and report the stars you earned at each step.
4. Play one challenge deliberately badly and confirm the stars drop as the rules say, then replay it well and confirm the saved total does not go down.
5. Reload mid-station and confirm it resumes at the right step.
6. If a headless browser is available, check every challenge type at 390px and 1280px wide, in light and dark mode, and confirm nothing scrolls sideways at 360px. Play one full challenge using only the keyboard. If no browser is available, say so.
7. No console errors or hydration warnings, and no requests to any host other than the site itself.
8. Push your branch to GitHub, confirm it reached the remote, and open a pull request into `main`. Report the branch name and last commit hash. If the session cannot open the pull request, say so and I will.

## When you finish

Write a short summary: what you built, the result of each check, anything you could not verify, and anything you chose not to build. List any content gaps you noticed, but do not fix them here.
