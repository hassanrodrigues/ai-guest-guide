import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";

import { buildChatSystemPrompt } from "@/lib/ai/prompts/chat";
import { conversationLimitReply, toTextMessages } from "@/lib/chat-messages";
import {
  AI_MODEL,
  CHAT_MAX_TOKENS,
  CHAT_MESSAGES_PER_IP_PER_DAY,
  CHAT_TEMPERATURE,
  PROPERTY_CODE_REGEX,
} from "@/lib/constants";
import { getCachedGuide } from "@/lib/services/guide.service";
import { findByCode } from "@/lib/services/property.service";
import {
  clientIp,
  consumeIpQuota,
  DAILY_BUDGET_MESSAGE,
  isOverDailyBudget,
  recordTokens,
} from "@/lib/services/usage.service";
import { formatPhone } from "@/lib/utils";

// Prisma + Anthropic need the Node.js runtime; a first-time guide generation
// can be slow, so raise the budget.
export const runtime = "nodejs";
export const maxDuration = 60;

/** Answers in the chat without calling the model, so a limit reads like a reply. */
function textReply(text: string): Response {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: "text-start", id: "limit" });
        writer.write({ type: "text-delta", id: "limit", delta: text });
        writer.write({ type: "text-end", id: "limit" });
      },
    }),
  });
}

export async function POST(request: Request) {
  let code: string;
  let messages: UIMessage[];
  try {
    const body: unknown = await request.json();
    const obj = (body ?? {}) as { code?: unknown; messages?: unknown };
    code = typeof obj.code === "string" ? obj.code.trim().toUpperCase() : "";
    messages = toTextMessages(obj.messages);
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  if (!PROPERTY_CODE_REGEX.test(code)) {
    return NextResponse.json(
      { error: "Código de imóvel inválido." },
      { status: 400 },
    );
  }

  if (messages.at(-1)?.role !== "user") {
    return NextResponse.json(
      { error: "A conversa precisa terminar com uma pergunta." },
      { status: 400 },
    );
  }

  const limitReply = conversationLimitReply(messages);
  if (limitReply) return textReply(limitReply);

  try {
    const property = await findByCode(code);
    if (!property) {
      return NextResponse.json(
        { error: "Imóvel não encontrado." },
        { status: 404 },
      );
    }

    const { host } = property;
    const contact = `Para dúvidas sobre a estadia, fale com ${host.name} pelo telefone ${formatPhone(host.phone)}.`;
    if (await isOverDailyBudget()) {
      return textReply(`${DAILY_BUDGET_MESSAGE} ${contact}`);
    }
    const ip = clientIp(request.headers);
    if (!(await consumeIpQuota("chat", ip, CHAT_MESSAGES_PER_IP_PER_DAY))) {
      return textReply(
        `Você chegou ao limite de ${CHAT_MESSAGES_PER_IP_PER_DAY} perguntas por dia nesta demo. ${contact}`,
      );
    }

    // Only the guide route generates guides. Until the page has generated
    // this one, the assistant answers from the property data alone.
    const guide = await getCachedGuide(code);

    const result = streamText({
      model: anthropic(AI_MODEL),
      system: buildChatSystemPrompt(property, guide),
      messages: await convertToModelMessages(messages),
      temperature: CHAT_TEMPERATURE,
      maxOutputTokens: CHAT_MAX_TOKENS,
      // streamText awaits this before closing the stream, so the write lands.
      onFinish: ({ totalUsage }) => recordTokens(totalUsage),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Unexpected error in /api/chat:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
