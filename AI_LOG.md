# AI Log

A record of how we used AI tools while building Wenova, for the Congressional App Challenge
AI disclosure. Add one line per task: the date, the tool, and what the AI wrote or did.
We review all AI-written code and must be able to explain it.

| Date | Tool | What the AI did |
| --- | --- | --- |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Wrote the `/api/feedback` route and its helpers in `lib/` (Claude client, JSON validation, sample feedback, lesson id list, input limits, placeholder prompt). Vasyl reviewed it and approved adding `@anthropic-ai/sdk`. |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Found why `npm run build` failed: the folder path was typed with the wrong capitalization (`d:\claude\wenovaai` instead of `D:\Claude\WenovaAI`). No code change. Created this log file. |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Created the empty `data/lessons.json` template (12 lesson ids, blank fields). The team wrote all lesson content. |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Claude Code wrote lib/feedback-prompt.ts from Vasyl's written design rules. It also drafted the essay grade scale for the team to edit, made `lib/lesson-ids.ts` read the ids from `data/lessons.json`, and added per-mode limits to `lib/limits.ts`. |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Vasyl caught two false corrections in an example ("the bridges that help people" is correct). Following his rules, Claude Code added "only flag clear errors" to the prompt, made non-English essays return `grade: null`, updated the contract in `CLAUDE.md`, and made `lib/validate-feedback.ts` check essay grades (1-5 or null). |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Committed the team's lesson content and `CLAUDE.md` rewrite to `feature/content-update` and pushed both branches. No new code. |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Added two rules Vasyl wrote to the prompt's "What to correct" section: "original" must appear exactly once in the text, and mistakes must not overlap. |
