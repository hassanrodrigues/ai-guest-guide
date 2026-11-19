import type { UIMessage } from "ai";

import {
  CHAT_MESSAGES_PER_CONVERSATION,
  MAX_CONVERSATION_CHARS,
  MAX_USER_MESSAGE_LENGTH,
} from "@/lib/constants";

/** Concatenated text parts of a UI message. */
export function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

/**
 * Keeps only user and assistant messages and their text parts. The history
 * comes from the client, so anything else (a "system" message, a file part)
 * would reach the model with more authority or cost than a guest question.
 */
export function toTextMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): UIMessage[] => {
    const { id, role, parts } = (item ?? {}) as Partial<UIMessage>;
    if ((role !== "user" && role !== "assistant") || !Array.isArray(parts)) {
      return [];
    }
    const textParts = parts.filter(
      (part) => part?.type === "text" && typeof part.text === "string",
    );
    return [{ id: String(id ?? ""), role, parts: textParts }];
  });
}

const formatCount = (n: number) => n.toLocaleString("pt-BR");

/** The guest-facing reason this conversation can't go to the model, or null when it can. */
export function conversationLimitReply(messages: UIMessage[]): string | null {
  const last = messages.at(-1);
  if (last && messageText(last).length > MAX_USER_MESSAGE_LENGTH) {
    return `Sua mensagem passou de ${formatCount(MAX_USER_MESSAGE_LENGTH)} caracteres. Escreva uma pergunta mais curta.`;
  }

  const questions = messages.filter((m) => m.role === "user").length;
  const chars = messages.reduce((sum, m) => sum + messageText(m).length, 0);
  if (questions > CHAT_MESSAGES_PER_CONVERSATION || chars > MAX_CONVERSATION_CHARS) {
    return `Esta conversa chegou ao limite de ${CHAT_MESSAGES_PER_CONVERSATION} perguntas. Recarregue a página para começar uma nova.`;
  }
  return null;
}
