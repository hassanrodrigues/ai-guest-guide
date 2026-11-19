/** AI model used for both guide generation and chat. */
export const AI_MODEL = "claude-sonnet-4-6" as const;

/**
 * Sampling temperatures. Guide generation allows mild variety in phrasing
 * while staying factual; chat is kept very low to maximize consistency and
 * minimize hallucination on stay-critical answers.
 */
export const GUIDE_TEMPERATURE = 0.4;
export const CHAT_TEMPERATURE = 0.2;

/** Token ceilings. Guides are richer structured output; chat replies are short. */
export const GUIDE_MAX_TOKENS = 2000;
export const CHAT_MAX_TOKENS = 300;

/** Property code format: 2–3 uppercase letters + 3 digits, e.g. "MAO001". */
export const PROPERTY_CODE_REGEX = /^[A-Z]{2,3}\d{3}$/;

/** Max length of a single user chat message, enforced client- and server-side. */
export const MAX_USER_MESSAGE_LENGTH = 1000;

/**
 * Cost limits for the public demo. Every counter is daily and resets at
 * 00:00 UTC; the token budget comes from DAILY_TOKEN_BUDGET.
 */
export const CHAT_MESSAGES_PER_IP_PER_DAY = 40;
export const CHAT_MESSAGES_PER_CONVERSATION = 20;
/** Caps the history a client sends back, so a forged long history can't inflate input tokens. */
export const MAX_CONVERSATION_CHARS = 50_000;
export const GUIDE_GENERATIONS_PER_IP_PER_DAY = 5;
export const DEFAULT_DAILY_TOKEN_BUDGET = 500_000;
