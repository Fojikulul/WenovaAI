# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/wenova/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.
>
> CLAUDE.md wins over this file if they ever disagree.

---

**Project:** Wenova
**Generated:** 2026-10-17 with the ui-ux-pro-max skill, then edited by Claude Code to match
the team's decisions (logo colors, CLAUDE.md design rules, WCAG AA). See AI_LOG.md.
**Audience:** teens learning English (not young kids). Calm, clear, encouraging.
**Design Dials:** Variance 2/10 (Centered / Minimal) | Density 3/10 (Spacious)
**Mode:** Light only. No dark mode.

---

## Global Rules

### Color Palette

Brand colors come from the logo (`public/logo.png`; sampled from the full-size original,
which is in git history). All contrast ratios are
checked against WCAG AA: 4.5:1 for text, 3:1 for UI parts (borders, underlines, icons).

| Role | Hex | CSS Variable | Contrast |
|------|-----|--------------|----------|
| Background | `#FFFFFF` | `--color-background` | |
| Surface (subtle panels) | `#F8FAFC` | `--color-surface` | |
| Text (body) | `#1E293B` | `--color-text` | 14.63 on white, 13.98 on surface |
| Heading (logo navy) | `#183666` | `--color-heading` | 11.94 on white |
| Muted text | `#475569` | `--color-muted` | 7.58 on white, 7.24 on surface |
| Divider (decorative only) | `#E2E8F0` | `--color-divider` | not used for meaning |
| Input border | `#7D8799` | `--color-border` | 3.62 on white, 3.46 on surface |
| **Primary** (logo blue): buttons | `#1F4EB0` | `--color-primary` | 7.57 (white text on it: 7.57) |
| Primary hover / pressed | `#183F8F` | `--color-primary-hover` | white text 9.78 |
| On Primary | `#FFFFFF` | `--color-on-primary` | |
| **Secondary** (logo dark green): links, correct | `#007B37` | `--color-secondary` | 5.40 on white, 5.16 on surface |
| Secondary hover | `#005C29` | `--color-secondary-hover` | 8.19 on white |
| On Secondary | `#FFFFFF` | `--color-on-secondary` | 5.40 |
| Rule tag background | `#E6F6EC` | `--color-tag-bg` | |
| Rule tag text | `#006B30` | `--color-tag-text` | 5.96 on tag bg |
| Logo bright green | `#0BB062` | `--color-logo-green` | **2.84: decoration only**, never text, borders, or icons that carry meaning |
| Focus ring | `#1F4EB0` | `--color-ring` | 7.57 on white |

**Who uses which color (from CLAUDE.md):**
- **Blue** = buttons only (and the focus ring).
- **Green** = rule tags, links, and correct answers.
- **Feedback colors** below = mistakes and hints. They are never used for buttons or links.

### Feedback Colors

| State | Background | Text | Line / Border | Contrast |
|-------|-----------|------|---------------|----------|
| **Mistake** (highlighted text) | `#FEF3F2` `--color-mistake-bg` | `#B42318` `--color-mistake-text` (labels only) | `#D92D20` wavy underline `--color-mistake-line` | text 6.05 on bg; body text 13.46 on bg; underline 4.44 |
| **Correct** (quiz answer, fixed mistake) | `#EDF8F1` `--color-correct-bg` | `#007B37` `--color-correct-text` | `#007B37` 2px border `--color-correct-border` | text 4.96 on bg, 5.40 on white |
| **Correct, selected** (filled) | `#007B37` | `#FFFFFF` | | 5.40 |
| **Hint** ("Good try! Here's one way") | `#FFFAEB` `--color-hint-bg` | `#B54708` `--color-hint-text` | `#DC6803` border `--color-hint-border` | text 5.20 on bg; border 3.49 |

**Telling feedback apart from brand elements (shape, not only color):**
- Correct is always a **box** with a check icon and the word "Correct!" or "You got it!".
- Links are always **underlined text**. Rule tags are always **small pills**.
- Mistakes are a **soft background plus a wavy underline**. The student's words keep the
  normal body text color, so a mistake never looks like red, shouting text.
- Never use color alone: every state also has an icon or a word.

### Typography

- **Heading Font:** Lexend (weights 600, 700). Designed to make reading easier.
- **Body Font:** Atkinson Hyperlegible Next (weights 400, 700). Made by the Braille Institute
  so similar letters (I / l / 1, O / 0) are easy to tell apart, which helps when a student
  compares their words with the fix letter by letter.
- **Loading:** `next/font/google` (`Lexend`, `Atkinson_Hyperlegible_Next`, subset `latin` and
  `latin-ext`). The fonts are served from our own site, so no request goes to Google at
  runtime. Don't use a CSS `@import` from Google Fonts.

| Use | Size (mobile / desktop) | Line height | Font |
|-----|------------------------|-------------|------|
| Page title (h1) | 28px / 36px | 1.25 | Lexend 700 |
| Section title (h2) | 22px / 28px | 1.3 | Lexend 600 |
| Card title (h3) | 18px / 20px | 1.4 | Lexend 600 |
| Body | 16px / 18px | 1.6 | Atkinson 400 |
| Student writing (text box, highlighted text) | 18px | 1.7 | Atkinson 400 |
| Buttons, tags, labels | 16px | 1.4 | Atkinson 700 |

No text smaller than 16px. Keep lines of student writing under about 70 characters wide.

### Spacing Variables

*Density: 3/10 — Spacious*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `24px` / `1.5rem` | Standard padding |
| `--space-lg` | `32px` / `2rem` | Section padding |
| `--space-xl` | `48px` / `3rem` | Large gaps |
| `--space-2xl` | `64px` / `4rem` | Section margins |
| `--space-3xl` | `96px` / `6rem` | Top of the home page |

Page side padding: 16px on mobile, 24px from 768px up. Content column max width: 720px.

### Radius and Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-md` | `8px` | Buttons, inputs |
| `--radius-lg` | `12px` | Cards, panels |
| `--radius-pill` | `9999px` | Rule tags |
| `--shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.06)` | Cards (optional) |

Minimalist: prefer a 1px divider over a shadow. No large or colored shadows.

---

## Component Specs

### Buttons

```css
/* Primary: the main action on a screen ("Check my essay", "Next question") */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  min-height: 48px;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 700;
  transition: background-color 150ms ease;
  cursor: pointer;
}
.btn-primary:hover,
.btn-primary:active { background: var(--color-primary-hover); }

/* Secondary: less important actions ("Show answer") */
.btn-secondary {
  background: var(--color-background);
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  min-height: 48px;
  padding: 10px 22px;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
}

/* Disabled and loading: keep the size, lower emphasis, and say why in text */
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
```

### Links

```css
.link {
  color: var(--color-secondary);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.link:hover { color: var(--color-secondary-hover); }
```

### Rule Tag

```css
.rule-tag {
  display: inline-flex;
  align-items: center;
  min-height: 32px; /* the tap area around it is at least 44px */
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--color-tag-bg);
  color: var(--color-tag-text);
  font-weight: 700;
}
```

### Mistake Highlight

```css
.mistake {
  background: var(--color-mistake-bg);
  color: inherit; /* the student's words keep the normal text color */
  text-decoration: underline wavy var(--color-mistake-line);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  border-radius: 4px;
  cursor: pointer;
}
```
Each highlight is a button for screen readers (for example "Mistake: a engineer. Tap to fix.").

### Fix Panel (opens when a mistake is tapped)

Shows inline, under the highlighted text. Not a modal or popup (CLAUDE.md: no popups).
White background, 1px divider border, `--radius-lg`, `--space-md` padding. It contains the
rule tag, a text input, a primary "Check" button, and a secondary "Show answer" button.
Result: correct box ("You got it!") or hint box ("Good try! Here's one way:").

### Correct and Hint Boxes

```css
.feedback-correct {
  background: var(--color-correct-bg);
  color: var(--color-correct-text);
  border: 2px solid var(--color-correct-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
} /* always starts with a check icon */

.feedback-hint {
  background: var(--color-hint-bg);
  color: var(--color-hint-text);
  border: 2px solid var(--color-hint-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
} /* always starts with a lightbulb icon */
```

### Inputs and Text Area

```css
.input {
  min-height: 48px;
  padding: 12px 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 18px;
}
.input:focus-visible {
  outline: 3px solid var(--color-ring);
  outline-offset: 2px;
}
```
Always a visible label above the field (not placeholder only), and a character counter
under the essay box (for example "320 / 5000").

### Cards

```css
.card {
  background: var(--color-background);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}
```
No hover lift or movement. A clickable card changes only its border color on hover.

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, sans-serif,
grid-based, essential

**Motion:** No animations (CLAUDE.md). Only color and background changes on hover, press, and
focus, 150ms or less. With `prefers-reduced-motion: reduce`, turn transitions off.

**Icons:** One SVG icon set (Lucide or Heroicons), never emojis. Icons next to text are
decorative (`aria-hidden`). Icon-only buttons need an `aria-label`.

**Loading and errors:** Friendly text everywhere ("Checking your writing…", "We couldn't
check your writing right now. Please try again."). Keep layout space reserved so nothing
jumps when results arrive.

### Page Pattern

An app, not a landing page: no hero banner, testimonials, or marketing sections.
- **Home** (`app/page.tsx`): logo, one short sentence, and two big buttons: "Check my essay"
  and "Lessons". Centered column.
- **Check page** and **Lessons** follow the same centered column and spacing.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Logo bright green `#0BB062` as text, borders, or meaningful icons** (fails contrast)
- ❌ **Blue for anything except buttons and focus** (no blue links, no blue "correct")
- ❌ **Feedback colors on buttons or links** (mistake red, hint amber)
- ❌ **Color as the only signal** (always add an icon or a word)
- ❌ **Red text for the student's own words** (use the soft highlight instead)
- ❌ **Dark mode or tinted page backgrounds** (white only)
- ❌ **Playful kids' styling** (rounded cartoon fonts, mascots, confetti)
- ❌ **Popups, modals, or animations** unless the team asks
- ❌ **Emojis as icons** (use SVG)
- ❌ **Text smaller than 16px**
- ❌ **Invisible focus states**
- ❌ **Raw hex values in components** (use the CSS variables)

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] Colors come from the CSS variables above, and blue/green are used as CLAUDE.md says
- [ ] Text contrast 4.5:1, UI parts 3:1 (ratios listed above)
- [ ] No text under 16px; student writing at 18px
- [ ] Tap targets at least 44×44px; buttons 48px tall
- [ ] Every feedback state has an icon or a word, not color alone
- [ ] Focus states visible for keyboard navigation
- [ ] No animations; `prefers-reduced-motion` respected
- [ ] No emojis as icons; one SVG icon set
- [ ] Friendly loading and error states
- [ ] Responsive: 375px, 768px, 1024px, 1440px; no horizontal scroll on mobile
