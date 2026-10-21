# Check Page (`/` and `/check`)

> These rules override `MASTER.md` for the Essay Checker only. Everything not listed here
> follows `MASTER.md`. CLAUDE.md still wins over both.

First decided by Vasyl on 2026-10-18; redesigned on 2026-10-20 after the reference design
humanizemax.ai (light and dark theme). See AI_LOG.md.

## Screen

- The checker is the home page (`/`); `/check` shows the same screen
  (`app/check/CheckerScreen.tsx`).
- **Hero** (centered): a white pill with a pulsing green dot and "A writing coach for everyone
  who asks [is my English correct?]", then a sheet of paper (cream in light, dark sheet in dark;
  faint ruled lines, a folded corner; colors `--paper*`) with the headline "Write better
  English / one fix at a time" (second line solid `secondary` green) and one line under it.
  The headline types itself once on load, fixing "Englsh" to "English" with the checker's
  mistake highlight (stronger pink on the cream paper in light mode) and a green check; the
  line under it shows from the start. A CSS caret blinks until JavaScript starts, and after
  1.5s without it the finished headline shows
  (`components/HeroHeadline.tsx`, changed by Johnny on 2026-10-21 with Vasyl's OK; under
  400px wide the headline is 32px so "English" and its check fit). Behind it: a faint grid and a soft
  green and blue glow (`components/HeroBackdrop.tsx`). From 1280px up, four tilted mistake
  stickers float around it (`components/MistakeStickers.tsx`).
- **Width:** up to 1240px. Page side padding 16px, 24px from 768px.
- **From 1024px up, editing:** the screen is exactly the window's height under the header
  (`--header-height`). The hero takes what it needs and the card fills the rest, so the page
  doesn't scroll. On windows 820px tall or less the hero is more compact.
- **From 1024px up, results:** the card becomes the window's full height and the page scrolls
  down to it. The hero stays above, so the student can scroll back up.
- **Below 1024px:** the two sides of the card stack and the page scrolls normally.

## The card (`app/check/EssayChecker.tsx`)

One card: white (`background`), 1px `divider` border, 16px corners, small shadow. A 4px
blue-to-green line runs along the top; while checking, a light moves along it.
- **Left side, "Your writing":** the writing box (input `border`, 3:1), with a small
  "Clear" / "Undo clear" button in its top right corner. While the box is empty, its middle
  shows "Paste your essay to get started" and three dashed buttons: **Paste text**
  (clipboard; if the browser refuses, a message explains Ctrl+V), **Upload file** (.txt only,
  read in the browser), **Try a sample** (`app/check/example-essay.ts`).
- **Right side, "Your feedback":** before checking, a centered "Ready when you are" (hidden on
  phones); while checking, the same layout with an hourglass; then the results.
- **Bottom bar:** the word and character counter and "Check my writing" while editing;
  "N things to fix · N fixed" and "Edit my writing" with results.
- Each side scrolls on its own from 1024px up.

## Results, top to bottom (no tabs: everything is in one view)

1. **Grade** (`components/GradeCard.tsx`): a ring that fills to the overall score and counts
   up to it (average of the four areas, computed in code, one decimal), "Practice estimate ·
   not an official grade", then the four areas with small navy bars and "4/5". Shown only
   when `grade` isn't null.
2. **Summary.**
3. **Practice next:** up to 3 lesson chips (green, underlined title, mistake count), opening
   `/lessons/<id>#practice-title` in a new tab. "other" is left out.
4. **Mistakes**, "most important first" (the server's order): buttons with "Mistake 2" (the
   number follows the text order), the rule tag, and the words in the mistake style. This
   list is the only part that scrolls.

- **No mistakes** and a grade: a correct box ("Nothing to fix. Great work!").
  **Not in English** (`grade: null`): only the summary, which asks for English.
- **Essay:** paragraphs split at line breaks (never inside a mistake), 18px, line height 1.7.
  Each mistake is a button with the MASTER.md highlight; the open one also gets a 2px
  `mistake-line` ring and pulses once. Screen readers hear "Mistake 2 of 5, Past Simple:".
- Picking a mistake (from the essay or the list) opens the **fix panel** in the feedback side.

## Fix panel (`components/MistakeFix.tsx`)

It slides in from the side in the feedback side, replacing the overview; Close (X) or Escape
slides back to the overview and returns focus to the highlight. Top to bottom:
1. "Mistake 2 of 5", the rule tag, Close.
2. "Your writing:" and the student's words.
3. "Try to fix it:" input, **prefilled with the student's words**, "Check my fix" and
   "Show answer".
4. The result (pops in): "You got it!"; or the nudge "That's the same as before. What word
   needs to change?"; or "Good try! Here's one way:" with the fix; "Show answer" gives
   "Here's one way:".
5. Once the answer shows: "Why:", "Another example of this rule:" (the lesson's example;
   skipped for "other"), and "Apply this fix" / after applying "Fixed in your essay." + Undo.
6. "Practice this rule" (new tab; hidden for "other").
7. Previous / Next, in text order.

## Motion and loading

- Motion (motion.dev) and CSS keyframes, as listed in CLAUDE.md. Everything respects
  "reduce motion".
- While checking: the button and the feedback side say "Checking your writing…" (the side's
  message is in a live region). The only moving part is the light along the top line. Never
  fake progress steps.
