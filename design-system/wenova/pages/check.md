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
- Page background stays **white**. Vasyl asked for a light gray page; MASTER.md forbids
  tinted page backgrounds, so the cards get their edges from the border instead.
- Spacing (tighter than other pages, so the cards start right under the title): page top
  padding 32px (40px from 768px), 8px between the h1 and the instruction line, 24px (32px
  from 768px) before the cards.

## Cards

Both areas are cards (MASTER.md card spec): white, 1px `divider` border, 12px corners.
- **Header row**, 72px tall (fits a 48px button with 12px above and below): the card title
  on the left (h2 element, card-title size 18px / 20px), a small toolbar on the right. On
  narrow screens the toolbar wraps under the title and stays right-aligned. A 1px `divider`
  line separates the header from the body. (Layout idea from the team's reference
  screenshot: bordered editor and results cards with a toolbar row. Only the layout was
  used, none of its colors or illustrations.)
- **Body padding:** 16px on phones, 24px from 768px.
- From 1024px the two cards are the **same height** (the grid stretches them).

### Writing card
- Toolbar: the word and character counter, then "Clear" (or "Undo clear" right after
  clearing, until the student types or picks the example). Toolbar buttons are the
  secondary button at exactly 48px tall with 16px side padding.
- The text box grows to fill the card: at least 300px tall, at least 416px from 1024px.
  Its border stays the input `border` color (3:1), not the lighter divider.
- Placeholder: "Paste or type your essay here…" in `muted`. The visible label is still the
  card title.
- "Check my writing" and "Try an example" sit under the text box. "Try an example" only
  shows while the box is empty, so it never replaces the student's writing.

### Feedback card
- Before the first check: a centered empty state, vertically centered in the card. A 32px
  document icon in a 64px `surface` circle, the heading "Ready when you are", and one line
  "Paste your essay and press Check my writing." The card is hidden on phones until the
  first check, where it would only push the page down.
- While checking: the same centered layout with the hourglass icon and "Checking your
  writing…".

## Loading

- **No spinner or moving bar** (CLAUDE.md: no animations). While checking, the button shows
  an hourglass icon and the words "Checking your writing…", and the results area says the
  same. Nothing moves.
- The message is in a live region, so screen readers say it too.
- Never fake progress steps or claim work the server hasn't done.
