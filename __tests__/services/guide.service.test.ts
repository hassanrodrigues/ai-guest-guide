import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrGenerate } from "@/lib/services/guide.service";
import { AIGenerationError, UsageLimitError } from "@/lib/errors";
import { maoProperty, sampleGuide } from "../fixtures/property";

const IP = "203.0.113.7";
const USAGE = { inputTokens: 3000, outputTokens: 1500, totalTokens: 4500 };

// Spies for every collaborator the service touches. vi.hoisted lets the
// vi.mock factories (hoisted above imports) reference them.
const {
  guideFindUnique,
  guideUpsert,
  propertyFindUnique,
  executeRaw,
  generateObject,
  findRealPlaces,
  consumeIpQuota,
  isOverDailyBudget,
  recordTokens,
} = vi.hoisted(() => ({
  guideFindUnique: vi.fn(),
  guideUpsert: vi.fn(),
  propertyFindUnique: vi.fn(),
  executeRaw: vi.fn(),
  generateObject: vi.fn(),
  findRealPlaces: vi.fn(),
  consumeIpQuota: vi.fn(),
  isOverDailyBudget: vi.fn(),
  recordTokens: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const prisma = {
    generatedGuide: { findUnique: guideFindUnique, upsert: guideUpsert },
    property: { findUnique: propertyFindUnique },
    $executeRaw: executeRaw,
    // The interactive transaction runs its callback against the same mocks.
    $transaction: (fn: (tx: unknown) => unknown) => fn(prisma),
  };
  return { prisma };
});
vi.mock("ai", () => ({
  generateObject,
  NoObjectGeneratedError: {
    isInstance: (error: unknown) =>
      (error as { name?: string })?.name === "AI_NoObjectGeneratedError",
  },
}));
vi.mock("@ai-sdk/anthropic", () => ({ anthropic: vi.fn(() => "mock-model") }));
// Places is out of scope here — resolve empty so generation runs ungrounded.
vi.mock("@/lib/services/places.service", () => ({ findRealPlaces }));
vi.mock("@/lib/services/usage.service", () => ({
  consumeIpQuota,
  isOverDailyBudget,
  recordTokens,
  DAILY_BUDGET_MESSAGE: "limite de hoje",
}));

beforeEach(() => {
  guideFindUnique.mockReset();
  guideUpsert.mockReset().mockResolvedValue(undefined);
  propertyFindUnique.mockReset().mockResolvedValue(maoProperty);
  executeRaw.mockReset().mockResolvedValue(1);
  generateObject.mockReset();
  findRealPlaces.mockReset().mockResolvedValue([]);
  consumeIpQuota.mockReset().mockResolvedValue(true);
  isOverDailyBudget.mockReset().mockResolvedValue(false);
  recordTokens.mockReset().mockResolvedValue(undefined);
});

describe("guideService.getOrGenerate", () => {
  it("returns the cached guide when one exists for the property", async () => {
    guideFindUnique.mockResolvedValue({ content: sampleGuide });

    const result = await getOrGenerate("MAO001", IP);

    expect(result).toEqual(sampleGuide);
    expect(generateObject).not.toHaveBeenCalled();
    expect(guideUpsert).not.toHaveBeenCalled();
  });

  it("generates and persists a new guide when none exists in cache", async () => {
    guideFindUnique.mockResolvedValue(null);
    generateObject.mockResolvedValue({ object: sampleGuide, usage: USAGE });

    const result = await getOrGenerate("MAO001", IP);

    expect(result).toEqual(sampleGuide);
    expect(generateObject).toHaveBeenCalledTimes(1);
    expect(guideUpsert).toHaveBeenCalledTimes(1);
    expect(guideUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { propertyCode: "MAO001" },
        create: expect.objectContaining({ content: sampleGuide }),
      }),
    );
  });

  it("throws AIGenerationError when the LLM call fails", async () => {
    guideFindUnique.mockResolvedValue(null);
    generateObject.mockRejectedValue(new Error("model exploded"));

    await expect(getOrGenerate("MAO001", IP)).rejects.toBeInstanceOf(
      AIGenerationError,
    );
    expect(guideUpsert).not.toHaveBeenCalled();
  });

  it("passes the property context to the prompt builder", async () => {
    guideFindUnique.mockResolvedValue(null);
    generateObject.mockResolvedValue({ object: sampleGuide, usage: USAGE });

    await getOrGenerate("MAO001", IP);

    const callArg = generateObject.mock.calls[0][0];
    expect(callArg.system).toContain("Manaus");
    expect(callArg.system).toContain("Centro Histórico");
  });

  it("regenerates when cached content fails schema validation", async () => {
    // Stale/malformed cache row (missing the required arrays).
    guideFindUnique.mockResolvedValue({ content: { welcomeMessage: "stale" } });
    generateObject.mockResolvedValue({ object: sampleGuide, usage: USAGE });

    const result = await getOrGenerate("MAO001", IP);

    expect(result).toEqual(sampleGuide);
    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it("persists the regenerated guide, overwriting a schema-invalid cache row", async () => {
    guideFindUnique.mockResolvedValue({ content: { welcomeMessage: "stale" } });
    generateObject.mockResolvedValue({ object: sampleGuide, usage: USAGE });

    await getOrGenerate("MAO001", IP);

    expect(guideUpsert).toHaveBeenCalledTimes(1);
    expect(guideUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { propertyCode: "MAO001" },
        update: expect.objectContaining({ content: sampleGuide }),
      }),
    );
  });

  it("serves a cache hit without touching any limit or the lock", async () => {
    guideFindUnique.mockResolvedValue({ content: sampleGuide });

    await getOrGenerate("MAO001", IP);

    expect(isOverDailyBudget).not.toHaveBeenCalled();
    expect(consumeIpQuota).not.toHaveBeenCalled();
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("does not generate again when a concurrent request saved the guide while it waited on the lock", async () => {
    guideFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ content: sampleGuide });

    const result = await getOrGenerate("MAO001", IP);

    expect(result).toEqual(sampleGuide);
    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(generateObject).not.toHaveBeenCalled();
    expect(consumeIpQuota).not.toHaveBeenCalled();
  });

  it("refuses to generate once the daily token budget is spent", async () => {
    guideFindUnique.mockResolvedValue(null);
    isOverDailyBudget.mockResolvedValue(true);

    await expect(getOrGenerate("MAO001", IP)).rejects.toThrow(
      new UsageLimitError("limite de hoje"),
    );
    expect(generateObject).not.toHaveBeenCalled();
    expect(consumeIpQuota).not.toHaveBeenCalled();
  });

  it("refuses to generate once the visitor used up the daily generations", async () => {
    guideFindUnique.mockResolvedValue(null);
    consumeIpQuota.mockResolvedValue(false);

    await expect(getOrGenerate("MAO001", IP)).rejects.toBeInstanceOf(
      UsageLimitError,
    );
    expect(consumeIpQuota).toHaveBeenCalledWith("guide", IP, 5);
    expect(generateObject).not.toHaveBeenCalled();
  });

  it("records the tokens the generation used", async () => {
    guideFindUnique.mockResolvedValue(null);
    generateObject.mockResolvedValue({ object: sampleGuide, usage: USAGE });

    await getOrGenerate("MAO001", IP);

    expect(recordTokens).toHaveBeenCalledWith(USAGE);
  });

  it("records the tokens of an output that failed the schema", async () => {
    guideFindUnique.mockResolvedValue(null);
    generateObject.mockRejectedValue(
      Object.assign(new Error("bad json"), {
        name: "AI_NoObjectGeneratedError",
        usage: USAGE,
      }),
    );

    await expect(getOrGenerate("MAO001", IP)).rejects.toBeInstanceOf(
      AIGenerationError,
    );
    expect(recordTokens).toHaveBeenCalledWith(USAGE);
  });
});
