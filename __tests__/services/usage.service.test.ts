import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clientIp,
  consumeIpQuota,
  dailyTokenBudget,
  isOverDailyBudget,
  recordTokens,
} from "@/lib/services/usage.service";
import type { LanguageModelUsage } from "ai";

const { queryRaw, counterFindUnique } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  counterFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: queryRaw,
    usageCounter: { findUnique: counterFindUnique },
  },
}));

// $queryRaw is a tagged template: the values follow the strings array.
function sqlValues(call: unknown[]): unknown[] {
  return call.slice(1);
}

function usage(partial: Partial<LanguageModelUsage>): LanguageModelUsage {
  return {
    inputTokens: undefined,
    outputTokens: undefined,
    totalTokens: undefined,
    inputTokenDetails: { noCacheTokens: undefined, cacheReadTokens: undefined, cacheWriteTokens: undefined },
    outputTokenDetails: { textTokens: undefined, reasoningTokens: undefined },
    ...partial,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-19T23:59:00Z"));
  queryRaw.mockReset();
  counterFindUnique.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("clientIp", () => {
  it("takes the rightmost X-Forwarded-For entry, the one the proxy added", () => {
    const headers = new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("ignores a forged entry sent by the client", () => {
    const headers = new Headers({ "x-forwarded-for": "1.1.1.1,203.0.113.7 " });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to a shared bucket when there is no proxy header", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("consumeIpQuota", () => {
  it("allows the request while the count is within the limit", async () => {
    queryRaw.mockResolvedValue([{ count: 40 }]);
    await expect(consumeIpQuota("chat", "203.0.113.7", 40)).resolves.toBe(true);
  });

  it("refuses the request once the count passes the limit", async () => {
    queryRaw.mockResolvedValue([{ count: 41 }]);
    await expect(consumeIpQuota("chat", "203.0.113.7", 40)).resolves.toBe(false);
  });

  it("keys the counter by scope, IP hash and UTC day, never the raw IP", async () => {
    queryRaw.mockResolvedValue([{ count: 1 }]);
    await consumeIpQuota("guide", "203.0.113.7", 5);

    const [key, by] = sqlValues(queryRaw.mock.calls[0]);
    expect(key).toMatch(/^guide:[0-9a-f]{16}:2026-11-19$/);
    expect(key).not.toContain("203.0.113.7");
    expect(by).toBe(1);
  });

  it("counts different IPs separately", async () => {
    queryRaw.mockResolvedValue([{ count: 1 }]);
    await consumeIpQuota("chat", "203.0.113.7", 40);
    await consumeIpQuota("chat", "198.51.100.2", 40);

    const [first] = sqlValues(queryRaw.mock.calls[0]);
    const [second] = sqlValues(queryRaw.mock.calls[1]);
    expect(first).not.toBe(second);
  });
});

describe("daily token budget", () => {
  it("reads DAILY_TOKEN_BUDGET from the environment", () => {
    vi.stubEnv("DAILY_TOKEN_BUDGET", "1000");
    expect(dailyTokenBudget()).toBe(1000);
  });

  it("falls back to the default when the variable is missing or invalid", () => {
    vi.stubEnv("DAILY_TOKEN_BUDGET", "lots");
    expect(dailyTokenBudget()).toBe(500_000);
  });

  it("is over budget once today's tokens reach it", async () => {
    vi.stubEnv("DAILY_TOKEN_BUDGET", "1000");
    counterFindUnique.mockResolvedValue({ key: "tokens:2026-11-19", count: 1000 });

    await expect(isOverDailyBudget()).resolves.toBe(true);
    expect(counterFindUnique).toHaveBeenCalledWith({
      where: { key: "tokens:2026-11-19" },
    });
  });

  it("is under budget below it, or when nothing was used today", async () => {
    vi.stubEnv("DAILY_TOKEN_BUDGET", "1000");
    counterFindUnique.mockResolvedValueOnce({ key: "tokens:2026-11-19", count: 999 });
    await expect(isOverDailyBudget()).resolves.toBe(false);

    counterFindUnique.mockResolvedValueOnce(null);
    await expect(isOverDailyBudget()).resolves.toBe(false);
  });
});

describe("recordTokens", () => {
  it("adds the call's total tokens to today's counter", async () => {
    queryRaw.mockResolvedValue([{ count: 1234 }]);
    await recordTokens(usage({ inputTokens: 1000, outputTokens: 234, totalTokens: 1234 }));

    expect(sqlValues(queryRaw.mock.calls[0])).toEqual(["tokens:2026-11-19", 1234, 1234]);
  });

  it("sums input and output when the provider omits the total", async () => {
    queryRaw.mockResolvedValue([{ count: 300 }]);
    await recordTokens(usage({ inputTokens: 200, outputTokens: 100 }));

    expect(sqlValues(queryRaw.mock.calls[0])[1]).toBe(300);
  });

  it("writes nothing when the call reported no usage", async () => {
    await recordTokens(undefined);
    await recordTokens(usage({}));
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
