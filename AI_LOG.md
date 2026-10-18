# AI Log

A record of how we used AI tools while building Wenova, for the Congressional App Challenge
AI disclosure. Add one line per task: the date, the tool, and what the AI wrote or did.
We review all AI-written code and must be able to explain it.

| Date | Tool | What the AI did |
| --- | --- | --- |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Wrote the `/api/feedback` route and its helpers in `lib/` (Claude client, JSON validation, sample feedback, lesson id list, input limits, placeholder prompt). Vasyl reviewed it and approved adding `@anthropic-ai/sdk`. |
| 2026-10-17 | Claude Code (Claude Opus 5.5) | Found why `npm run build` failed: the folder path was typed with the wrong capitalization (`d:\claude\wenovaai` instead of `D:\Claude\WenovaAI`). No code change. Created this log file. |
