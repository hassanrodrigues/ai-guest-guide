import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, NoObjectGeneratedError } from "ai";

import { Prisma } from "@/app/generated/prisma/client";
import {
  AI_MODEL,
  GUIDE_GENERATIONS_PER_IP_PER_DAY,
  GUIDE_MAX_TOKENS,
  GUIDE_TEMPERATURE,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  AIGenerationError,
  PropertyNotFoundError,
  UsageLimitError,
} from "@/lib/errors";
import {
  buildGuideSystemPrompt,
  type RealPlacesContext,
} from "@/lib/ai/prompts/guide-generator";
import { ExperienceGuideSchema, type ExperienceGuide } from "@/lib/ai/schemas";
import { findByCode } from "@/lib/services/property.service";
import { findRealPlaces } from "@/lib/services/places.service";
import {
  consumeIpQuota,
  DAILY_BUDGET_MESSAGE,
  isOverDailyBudget,
  recordTokens,
} from "@/lib/services/usage.service";

/**
 * Fetch real venues to ground generation. Returns undefined (triggering
 * fallback mode) if the Places API is unavailable for any reason — a missing
 * key in local dev, or a transient/permission failure in production. Logs a
 * detailed warning so the degraded mode is visible in the server logs.
 */
async function fetchGrounding(
  code: string,
  address: { neighborhood: string; city: string },
): Promise<RealPlacesContext | undefined> {
  const location = `${address.neighborhood}, ${address.city}`;
  try {
    const [restaurants, attractions, essentials] = await Promise.all([
      findRealPlaces("restaurants", location),
      findRealPlaces("tourist attractions and landmarks", location),
      findRealPlaces("pharmacy supermarket", location),
    ]);
    return { restaurants, attractions, essentials };
  } catch (error) {
    console.warn(
      `[guide] Places API unavailable for ${code}; generating WITHOUT grounding (fallback mode). Reason:`,
      error instanceof Error ? error.message : error,
    );
    return undefined;
  }
}

/**
 * The cached guide for an (already normalized) code, or null when there is
 * none. Never calls the model. The cached JSON is re-validated against the
 * current schema rather than trusted blindly: the schema can evolve, so a
 * stale row is treated as missing and regenerated.
 */
export async function getCachedGuide(
  code: string,
): Promise<ExperienceGuide | null> {
  const cached = await prisma.generatedGuide.findUnique({
    where: { propertyCode: code },
  });
  if (!cached) return null;

  const result = ExperienceGuideSchema.safeParse(cached.content);
  if (result.success) return result.data;
  console.warn(`Cached guide for ${code} failed schema validation, regenerating.`);
  return null;
}

/** Throws UsageLimitError when the demo can't afford another generation. */
async function assertCanGenerate(ip: string): Promise<void> {
  if (await isOverDailyBudget()) {
    throw new UsageLimitError(DAILY_BUDGET_MESSAGE);
  }
  if (!(await consumeIpQuota("guide", ip, GUIDE_GENERATIONS_PER_IP_PER_DAY))) {
    throw new UsageLimitError(
      "Você chegou ao limite de guias gerados por dia nesta demo. Volte amanhã.",
    );
  }
}

/** Generate a fresh guide for an (already normalized) code and persist it. */
async function generateAndPersist(code: string): Promise<ExperienceGuide> {
  // findByCode normalizes + validates the code and returns null when missing.
  const property = await findByCode(code);
  if (!property) {
    throw new PropertyNotFoundError(code);
  }

  // Ground generation in real venues (RAG). If the Places API is unavailable,
  // fall back to ungrounded generation under the strengthened prompt — the
  // guide still generates, just without the real-place allowlist.
  const places = await fetchGrounding(code, property.address);

  let guide: ExperienceGuide;
  try {
    const { object, usage } = await generateObject({
      model: anthropic(AI_MODEL),
      schema: ExperienceGuideSchema,
      system: buildGuideSystemPrompt(property, places),
      prompt:
        "Gere o guia de experiências local para este imóvel, seguindo rigorosamente as regras do sistema.",
      temperature: GUIDE_TEMPERATURE,
      maxOutputTokens: GUIDE_MAX_TOKENS,
    });
    await recordTokens(usage);
    guide = object;
  } catch (error) {
    // Output that failed the schema was still paid for.
    if (NoObjectGeneratedError.isInstance(error)) {
      await recordTokens(error.usage);
    }
    throw new AIGenerationError(
      `Não foi possível gerar o guia para o imóvel ${code}.`,
      { cause: error },
    );
  }

  await prisma.generatedGuide.upsert({
    where: { propertyCode: code },
    create: {
      propertyCode: code,
      content: guide as unknown as Prisma.InputJsonValue,
      model: AI_MODEL,
    },
    update: {
      content: guide as unknown as Prisma.InputJsonValue,
      model: AI_MODEL,
    },
  });

  return guide;
}

/**
 * Return the local guide for a property, generating and caching it on first
 * request. A cache hit never calls the model and never counts against any
 * limit. A miss checks the daily budget and the visitor's generation quota,
 * then generates once and persists.
 *
 * Throws PropertyNotFoundError if the code resolves to no property,
 * UsageLimitError when a demo limit is reached, and wraps any AI SDK failure in
 * AIGenerationError so callers map it to a single status.
 */
export async function getOrGenerate(
  propertyCode: string,
  ip: string,
): Promise<ExperienceGuide> {
  const code = propertyCode.trim().toUpperCase();

  const cached = await getCachedGuide(code);
  if (cached) return cached;

  // ponytail: two first visits to the same property at the same moment both generate; add a per-property lock if the token counter ever shows it.
  await assertCanGenerate(ip);
  return generateAndPersist(code);
}
