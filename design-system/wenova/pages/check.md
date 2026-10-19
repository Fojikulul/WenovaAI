# Check Page (`app/check/`)

> These rules override `MASTER.md` for the Essay Checker only. Everything not listed here
> follows `MASTER.md`. CLAUDE.md still wins over both.

Decided by Vasyl on 2026-10-18 (see AI_LOG.md).

## Layout

- **Below 1024px:** one column, the same as every other page: max width 720px, editor on
  top, results under it.
- **From 1024px up:** two columns side by side. The page can be up to 1120px wide.
  - Left: the student's writing (the text box, or the highlighted essay after checking).
    About 620px wide, so lines of student writing stay under about 70 characters.
  - Right: the results (summary, count, grade, list of mistakes). 400px wide.
  - 48px gap between the columns.
- The header stays 720px wide, so on wide screens the logo does not line up with the page.
  That's accepted.
- Before the first check, the right column shows one short line ("Your feedback will show
  here."). It's hidden on phones, where it would only push the page down.

## Loading

- **No spinner or moving bar** (CLAUDE.md: no animations). While checking, the button shows
  an hourglass icon and the words "Checking your writing…", and the results area says the
  same. Nothing moves.
- The message is in a live region, so screen readers say it too.
- Never fake progress steps or claim work the server hasn't done.
