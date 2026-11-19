import { createHash } from "node:crypto";
import type { LanguageModelUsage } from "ai";

import { DEFAULT_DAILY_TOKEN_BUDGET } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const DAILY_BUDGET_MESSAGE =
  "A demo chegou ao limite de uso de hoje e volta a responder amanhã.";

/** UTC day, e.g. "2026-11-19": the window every counter resets on. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The visitor's IP as seen by the deploy proxy. The proxy appends the address
 * the connection came from to X-Forwarded-For, so only the rightmost entry is
 * trustworthy: everything to its left can be sent by the client.
 */
// ponytail: assumes exactly one proxy in front of the app (Vercel or Traefik); behind a CDN too, read one more hop to the left.
export function clientIp(headers: Headers): string {
  const rightmost = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return rightmost || "unknown";
}

// Counters store a hash, never the raw IP.
function ipHash(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// One atomic statement, so concurrent requests can't both read the same count.
// ponytail: rows from past days are never deleted; add a daily cleanup if the table grows.
async function increment(key: string, by: number): Promise<number> {
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO usage_counters (key, count) VALUES (${key}, ${by})
    ON CONFLICT (key) DO UPDATE SET count = usage_counters.count + ${by}
    RETURNING count`;
  return row.count;
}

/** Counts one more use of `scope` by this IP today. False once past `limit`. */
export async function consumeIpQuota(
  scope: "chat" | "guide",
  ip: string,
  limit: number,
): Promise<boolean> {
  const count = await increment(`${scope}:${ipHash(ip)}:${today()}`, 1);
  return count <= limit;
}

export function dailyTokenBudget(): number {
  const budget = Number(process.env.DAILY_TOKEN_BUDGET);
  return Number.isInteger(budget) && budget > 0
    ? budget
    : DEFAULT_DAILY_TOKEN_BUDGET;
}

/**
 * Checked before every model call. Calls already in flight can still finish,
 * so the real total may pass the budget by at most a few calls.
 */
export async function isOverDailyBudget(): Promise<boolean> {
  const row = await prisma.usageCounter.findUnique({
    where: { key: `tokens:${today()}` },
  });
  return (row?.count ?? 0) >= dailyTokenBudget();
}

/** Adds a model call's token usage, as the AI SDK reports it, to today's total. */
export async function recordTokens(
  usage: LanguageModelUsage | undefined,
): Promise<void> {
  const tokens =
    usage?.totalTokens ?? (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
  if (tokens > 0) await increment(`tokens:${today()}`, tokens);
}
