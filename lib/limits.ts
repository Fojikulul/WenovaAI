// Shared by the server route and (later) the writing page, so both check the same limit.
export const MAX_TEXT_LENGTH = 1000;

export const MAX_MISTAKES = 5;

// Per-mode limits from the CLAUDE.md contract. The route still uses the two
// limits above; it switches to these when it supports "practice" and "essay".
export const MAX_TEXT_LENGTH_BY_MODE = { practice: 500, essay: 5000 } as const;
export const MAX_MISTAKES_BY_MODE = { practice: 5, essay: 10 } as const;

export type FeedbackMode = keyof typeof MAX_MISTAKES_BY_MODE;
