export const MAX_TEXT_LENGTH_BY_MODE = { practice: 500, essay: 5000 } as const;
export const MAX_MISTAKES_BY_MODE = { practice: 5, essay: 10 } as const;

export type FeedbackMode = keyof typeof MAX_MISTAKES_BY_MODE;
