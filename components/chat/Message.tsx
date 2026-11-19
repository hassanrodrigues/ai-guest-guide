import { cn } from "@/lib/utils";

interface MessageProps {
  role: "user" | "assistant";
  children: React.ReactNode;
}

export function Message({ role, children }: MessageProps) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-line",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-card text-foreground ring-1 ring-border",
        )}
      >
        {children}
      </div>
    </div>
  );
}
