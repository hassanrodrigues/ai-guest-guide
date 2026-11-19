import { mkdirSync, writeFileSync } from "node:fs";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

import { buildChatSystemPrompt } from "@/lib/ai/prompts/chat";
import { AI_MODEL, CHAT_MAX_TOKENS, CHAT_TEMPERATURE } from "@/lib/constants";
import type { TypedProperty } from "@/lib/types/property";
import { properties } from "@/prisma/properties";
import { CASES, GUIDES, RULES, type EvalCase, type RuleId } from "./cases";
import type { EvalContext } from "./checks";

const TARGET = Number(process.env.EVALS_TARGET ?? 0.9);
const REPORT_PATH = "docs/evals.md";

interface Result {
  evalCase: EvalCase;
  answer: string;
  failures: string[];
}

function findProperty(code: string): TypedProperty {
  const seed = properties.find((p) => p.code === code);
  if (!seed) throw new Error(`No property ${code} in prisma/properties.ts`);
  return { ...seed, createdAt: new Date(0), updatedAt: new Date(0) };
}

// Same system prompt and settings as app/api/chat/route.ts, without streaming.
async function askChat(ctx: Omit<EvalContext, "answer">, question: string): Promise<string> {
  const { text } = await generateText({
    model: anthropic(AI_MODEL),
    system: buildChatSystemPrompt(ctx.property, ctx.guide),
    messages: [{ role: "user", content: question }],
    temperature: CHAT_TEMPERATURE,
    maxOutputTokens: CHAT_MAX_TOKENS,
  });
  return text;
}

const JUDGE_SYSTEM = `You check one answer from the guest-chat assistant of a short-term rental.
The assistant may only name specific places (restaurants, bars, cafés, shops, attractions, beaches, venues) listed under ALLOWED PLACES.
List every specific place the answer names that is not in ALLOWED PLACES, even if it exists in real life.
Do not list: anything that is part of the property's name or location, generic words such as "restaurantes" or "sorveteria", apps such as Google Maps, or a place from the guest's question that the answer only repeats to say it has no information about it.
Return an empty list when there is none.`;

// Only for what code can't check: whether free text names a place outside a list.
async function judgeCitations(ctx: EvalContext, question: string): Promise<string | null> {
  const { property, guide, answer } = ctx;
  const allowed = guide
    ? [...guide.restaurants, ...guide.attractions, ...guide.essentials].map((p) => p.name)
    : [];
  const { output } = await generateText({
    model: anthropic(AI_MODEL),
    temperature: 0,
    output: Output.object({ schema: z.object({ placesOutsideList: z.array(z.string()) }) }),
    system: JUDGE_SYSTEM,
    prompt: [
      `PROPERTY: ${property.name}, ${property.address.neighborhood}, ${property.address.city}/${property.address.state}`,
      `ALLOWED PLACES:\n${allowed.map((name) => `- ${name}`).join("\n") || "(none)"}`,
      `GUEST QUESTION:\n${question}`,
      `ASSISTANT ANSWER:\n${answer}`,
    ].join("\n\n"),
  });
  const outside = output.placesOutsideList;
  return outside.length ? `names places outside the guide: ${outside.join(", ")}` : null;
}

async function runCase(evalCase: EvalCase): Promise<Result> {
  const property = findProperty(evalCase.propertyCode);
  const guide = GUIDES[evalCase.propertyCode] ?? null;
  const answer = await askChat({ property, guide }, evalCase.question);
  const ctx = { property, guide, answer };

  const failures = evalCase.checks.map((check) => check(ctx)).filter((f) => f !== null);
  if (evalCase.judgeCitations) {
    const verdict = await judgeCitations(ctx, evalCase.question);
    if (verdict) failures.push(verdict);
  }
  return { evalCase, answer, failures };
}

const percent = (n: number) => `${(n * 100).toFixed(1).replace(/\.0$/, "")}%`;

function checkedBy(rule: RuleId): string {
  const cases = CASES.filter((c) => c.rule === rule);
  const code = cases.some((c) => c.checks.length > 0);
  const judge = cases.some((c) => c.judgeCitations);
  return [code && "code", judge && "LLM judge"].filter(Boolean).join(" + ");
}

function report(results: Result[], passRate: number): string {
  const passed = results.filter((r) => r.failures.length === 0).length;
  const ruleRows = (Object.keys(RULES) as RuleId[]).map((rule) => {
    const ofRule = results.filter((r) => r.evalCase.rule === rule);
    const ok = ofRule.filter((r) => r.failures.length === 0).length;
    return `| \`${rule}\` | ${RULES[rule]} | ${checkedBy(rule)} | ${ok}/${ofRule.length} |`;
  });
  const caseSections = (Object.keys(RULES) as RuleId[]).map((rule) => {
    const entries = results
      .filter((r) => r.evalCase.rule === rule)
      .map(({ evalCase, answer, failures }) => {
        const verdict = failures.length ? `**failed:** ${failures.join("; ")}` : "passed";
        const quoted = answer.split("\n").map((line) => `> ${line}`).join("\n");
        return `**${evalCase.propertyCode}:** ${evalCase.question}\n\n${quoted}\n\n${verdict}`;
      });
    return `### \`${rule}\`\n\n${entries.join("\n\n")}`;
  });

  return `# Chat evals

The chat's 9 rules, checked against the real model. Generated by
\`npm run evals\`; don't edit by hand.

- Last run: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
- Model: \`${AI_MODEL}\`
- Result: ${passed} of ${results.length} cases passed (${percent(passRate)}). Target: ${percent(TARGET)}, ${passRate >= TARGET ? "met" : "**not met**"}.

Each case sends one question to the chat with the same system prompt and
settings as the app. Code checks the answer whenever it can (exact Wi-Fi data,
check-in time, a refusal, a reference to the host, no invented numbers). An
LLM judge is used only to find places named outside the guide. The MAO001
guide is a fixed fixture with invented restaurant names; ADC001 runs with no
guide.

Run it with \`npm run evals\` (needs \`ANTHROPIC_API_KEY\`). \`EVALS_TARGET\`
sets the pass rate the run must reach, from 0 to 1 (default 0.9); below it,
the command exits with an error.

## By rule

| Rule | What it checks | Checked by | Passed |
| --- | --- | --- | --- |
${ruleRows.join("\n")}

## Cases

${caseSections.join("\n\n")}
`;
}

async function main() {
  if (!(TARGET > 0 && TARGET <= 1)) {
    throw new Error(`EVALS_TARGET must be a number between 0 and 1, got "${process.env.EVALS_TARGET}"`);
  }
  const results: Result[] = [];
  // ponytail: sequential to stay under API rate limits; run in small batches if the suite grows.
  for (const evalCase of CASES) {
    const result = await runCase(evalCase);
    results.push(result);
    const mark = result.failures.length ? "✗" : "✓";
    console.log(`${mark} ${evalCase.rule} ${evalCase.propertyCode}: ${evalCase.question}`);
    for (const failure of result.failures) console.log(`    ${failure}`);
  }

  const passRate = results.filter((r) => r.failures.length === 0).length / results.length;
  console.log("");
  for (const rule of Object.keys(RULES) as RuleId[]) {
    const ofRule = results.filter((r) => r.evalCase.rule === rule);
    const ok = ofRule.filter((r) => r.failures.length === 0).length;
    console.log(`${rule.padEnd(20)} ${ok}/${ofRule.length}`);
  }
  console.log(`\nPassed ${percent(passRate)} of ${results.length} cases. Target ${percent(TARGET)}.`);

  mkdirSync("docs", { recursive: true });
  writeFileSync(REPORT_PATH, report(results, passRate));
  console.log(`Report written to ${REPORT_PATH}`);
  if (passRate < TARGET) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
