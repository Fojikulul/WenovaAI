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
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Vasyl rewrote the essay grade rubric and student description, and chose to keep "clarity" as the 4th grade area. Claude Code updated the route and helpers for practice and essay modes (per-mode limits, essay grade or null in the JSON schema, per-mode mock data), added a check that drops mistakes whose "original" isn't found exactly once or that overlap, fixed typos in the prompt, and wrote the clarity rubric line that Vasyl approved. |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Vasyl set the design constraints, updated the logo green and the CLAUDE.md design rules, and chose the colors, fonts, and light-only mode. Claude Code ran the ui-ux-pro-max design-system search, sampled the logo colors, checked WCAG contrast for every color pair, and rewrote `design-system/wenova/MASTER.md` to match those decisions. No app code changed. |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Vasyl approved the plan, chose inline SVG icons (no dependency) and `public/logo.png`, and deleted the original 1.2 MB logo. Claude Code wrote the design foundation: color and font variables in `app/globals.css`, Lexend and Atkinson Hyperlegible Next fonts and the logo header in `app/layout.tsx`, and the home page with two choices in `app/page.tsx`. It checked contrast from the CSS file and checked widths 375-1440px and keyboard focus in Chrome. |
