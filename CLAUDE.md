# CLAUDE.md - Wenova

## What this is
Wenova is an AI writing coach for multilingual students learning English (ESL/ESOL).
A student writes a paragraph and gets simple, encouraging feedback. Each mistake is tagged
with a grammar rule, and tapping the tag opens a short lesson card with practice questions.

Built by a two-person student team for the Congressional App Challenge 2026
(deadline: Monday Oct 26, 12:00 PM ET). A polished, working core beats extra features.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Claude API via `@anthropic-ai/sdk`, model `claude-sonnet-5-5`, called ONLY from server routes
- Hosted on Vercel (auto-deploys from `main`, pull requests get preview links)
- Supabase accounts are a stretch goal. Do not add Supabase unless asked.

## Commands
- `npm run dev` - local dev server at http://localhost:3000
- `npm run build` - production build (run before every pull request)
- `npm run lint` - lint

## Project structure
- `app/page.tsx` - writing page + feedback panel
- `app/api/feedback/route.ts` - sends student text to Claude, returns feedback JSON
- `components/` - UI components (FeedbackPanel, RuleTag, LessonCard, Quiz)
- `lib/` - server helpers (Claude client, feedback prompt, JSON validation)
- `data/lessons.json` - grammar lessons (written by the team)
- `AI_LOG.md` - log of AI assistance (required for the CAC disclosure)

## Data contracts
Do not change these formats without both teammates agreeing.

### Feedback response from /api/feedback
```json
{
  "mistakes": [
    {
      "original": "Yesterday I go to school",
      "fix": "Yesterday I went to school",
      "rule": "past-simple",
      "why": "Use past simple for finished actions."
    }
  ],
  "summary": "Clear ideas! Watch your past tense."
}
```
- `rule` must be a lesson `id` from `data/lessons.json`, or `"other"`
- At most 5 mistakes, most important first
- If there are no mistakes, return an empty array and an encouraging summary

### One lesson in data/lessons.json
```json
{
  "id": "past-simple",
  "title": "Past Simple",
  "rule": "Use past simple for actions that finished in the past.",
  "example": "I watched a movie last night.",
  "mistake": { "wrong": "I watch a movie last night.", "right": "I watched a movie last night." },
  "practice": [
    {
      "question": "She ___ home at 5 yesterday.",
      "options": ["go", "went", "goes"],
      "answer": "went",
      "explanation": "Yesterday means the action is finished, so use past simple."
    }
  ]
}
```

### Lesson ids
present-simple, present-continuous, past-simple, past-continuous, present-perfect,
past-perfect, future, articles, prepositions-in-on-at, subject-verb-agreement,
plurals, question-word-order

## Feedback style (how the AI coach talks to students)
- Audience: teens learning English. Explanations at B1 level: short sentences, common words.
- Encouraging, never shaming. The summary starts with something the student did well.
- Fix the mistake only. Never rewrite the whole paragraph; keep the student's voice and ideas.
- Explain why in one sentence.
- The team owns the actual prompt in `lib/feedback-prompt.ts`. Suggest edits; don't rewrite it.

## Design rules
- Minimalist, lots of whitespace. Palette: white background, blue as the main accent
  (buttons, correct answers), green as the secondary color (rule tags, links)
- Mobile-first: base font 16px or larger, high contrast, big tap targets
- No extra pages, popups, animations, or features unless asked
- Friendly loading and error states everywhere

## Engineering rules
- For any non-trivial task, plan first: list the files you'll change and wait for approval
- Keep changes small and focused on one feature or issue
- Never expose `ANTHROPIC_API_KEY` to the client. Never commit `.env*` files. The repo is PUBLIC.
- Validate Claude's JSON on the server; if it's invalid, return a friendly error instead of crashing
- Limit student input to 1,000 characters (check on both client and server)
- Don't store or log student writing, and don't collect personal info
- Don't add new dependencies without asking
- Check multiple-choice answers in code, not with AI

## Git workflow
- Never commit directly to `main`. Branches: `feature/<short-name>` or `fix/<short-name>`
- Before starting: `git checkout main && git pull`
- Small commits with clear messages, e.g. "Add lesson card component"
- Run `npm run build` before pushing. Pull requests reference their issue, e.g. "Closes #3"

## Team ownership
- Brain (owner: Vasyl): `app/api/`, `lib/` - feedback route, prompt, validation
- Face (owner: Johnny, Vasyl will start for a little): `app/page.tsx`, `components/` - UI, lesson cards, quiz
- Both: `data/lessons.json`
Stay inside the folders for the current task unless asked otherwise.

## Congressional App Challenge AI rules (important)
AI use is completely allowed
The team must understand and be able to explain all of the code. So:
- Do NOT write lesson content in `data/lessons.json`. You should ask before you include it, you suggest, team approves. You may review it additionally based if adding certain rules would be useful and rational
  , also review for grammar accuracy and point out errors.
- If a teammate says they want to write something themselves, guide and review instead of
  writing it for them, only if they want.
- After finishing a change, explain in plain language what the code does and why.
- End every task with one line starting with "AI_LOG:" that says what you wrote, so the team
  can copy it into `AI_LOG.md`.
