"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatInput } from "@/components/chat/ChatInput";
import { Message } from "@/components/chat/Message";
import { MessageList } from "@/components/chat/MessageList";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

interface ChatAssistantProps {
  propertyCode: string;
  hostName: string;
}

const TITLE = "Assistente do imóvel";

export function ChatAssistant({ propertyCode, hostName }: ChatAssistantProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Memoize so the transport (and the code it carries) is stable across renders.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { code: propertyCode },
      }),
    [propertyCode],
  );

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport,
  });

  const pending = status === "submitted";
  const busy = status === "submitted" || status === "streaming";

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList
        messages={messages}
        pending={pending}
        topSlot={
          <>
            <Message role="assistant">
              {`Oi! Respondo dúvidas sobre Wi-Fi, check-in, regras e lugares por perto, usando só os dados deste imóvel. Se eu não souber, indico falar com ${hostName}.`}
            </Message>
            {messages.length === 0 && (
              <SuggestedQuestions
                onSelect={(text) => sendMessage({ text })}
                disabled={busy}
              />
            )}
          </>
        }
      />
      {error && (
        <div className="flex items-center justify-between gap-2 border-t bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <span>A resposta não chegou.</span>
          <Button size="sm" variant="ghost" onClick={() => regenerate()}>
            <RefreshCw />
            Tentar de novo
          </Button>
        </div>
      )}
      <ChatInput onSend={(text) => sendMessage({ text })} disabled={busy} />
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed right-4 bottom-4 z-50 h-12 px-5 text-base shadow-lg shadow-rio/25 md:right-6 md:bottom-6"
      >
        <MessageCircle className="size-5" aria-hidden />
        Perguntar ao assistente
      </Button>

      {isDesktop ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
          >
            <SheetHeader className="border-b">
              <SheetTitle className="text-lg font-stretch-expanded">
                {TITLE}
              </SheetTitle>
            </SheetHeader>
            {body}
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="flex h-[85vh] flex-col">
            <DrawerHeader className="flex flex-row items-center justify-between border-b text-left">
              <DrawerTitle className="text-lg font-stretch-expanded">
                {TITLE}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm">
                  Fechar
                </Button>
              </DrawerClose>
            </DrawerHeader>
            {body}
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
