import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/runtimeConfig";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@/lib/router";

type ChatMsg = { role: "user" | "assistant"; content: string };

const QUICK_REPLIES = [
  "Show me scalping bots",
  "How does payment work?",
  "My order status",
];

async function streamChat(
  messages: ChatMsg[],
  productContext: Record<string, unknown> | undefined,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch(getApiUrl("/api/ai/chat-stream"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ messages, productContext }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const data = JSON.parse(raw) as { chunk?: string; done?: boolean; error?: string };
        if (data.error) throw new Error(data.error);
        if (data.chunk) onChunk(data.chunk);
      } catch {
        // ignore parse errors for incomplete chunks
      }
    }
  }
}

export function AIChatWidget() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const slugMatch = location.match(/^\/shop\/([^/?#]+)$/);
  const productSlug = slugMatch?.[1];
  const { data: product } = trpc.products.bySlug.useQuery(
    { slug: productSlug ?? "" },
    { enabled: !!productSlug && productSlug !== "shop" }
  );

  const productContext = useMemo(() => {
    if (!product) return undefined;
    return {
      name: product.name,
      slug: product.slug,
      category: product.category,
      platform: product.platform,
      price: product.salePrice ?? product.price,
      shortDesc: product.shortDesc,
    };
  }, [product]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, open]);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      const next: ChatMsg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setInput("");
      setStreaming(true);
      let assistant = "";
      setMessages([...next, { role: "assistant", content: "" }]);
      try {
        await streamChat(next, productContext, (chunk) => {
          assistant += chunk;
          setMessages([...next, { role: "assistant", content: assistant }]);
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        setMessages([...next, { role: "assistant", content: `Error: ${msg}` }]);
      } finally {
        setStreaming(false);
      }
    },
    [messages, productContext, streaming]
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open AI assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#ff00b3]/60 bg-[#0a0a0a] shadow-[0_0_20px_rgba(255,0,179,0.35),0_0_40px_rgba(204,255,0,0.15)] transition-transform hover:scale-105"
      >
        <span className="absolute inset-0 rounded-full bg-[#ccff00]/20 animate-ping opacity-40" />
        <MessageCircle className="relative h-7 w-7 text-[#ccff00]" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md border-l border-[rgba(204,255,0,0.2)] bg-[#080808] p-0 flex flex-col"
        >
          <SheetHeader className="p-4 border-b border-[rgba(255,255,255,0.06)] shrink-0">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-[#ccff00]" />
              NEOXP AI
            </SheetTitle>
            {product && (
              <p className="text-left text-xs text-[#ff00b3] font-medium truncate">
                Context: {product.name}
              </p>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0 px-3">
            <div className="space-y-3 py-4 pr-2">
              {messages.length === 0 && (
                <p className="text-sm text-white/50 text-center px-2">
                  Ask about EAs, checkout, PromptPay, or your orders.
                </p>
              )}
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex gap-2",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {m.role === "assistant" && (
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(204,255,0,0.25)] bg-[rgba(204,255,0,0.08)]">
                        <Sparkles className="h-4 w-4 text-[#ccff00]" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                        m.role === "user"
                          ? "bg-[#ccff00] text-black font-medium"
                          : "bg-[rgba(255,255,255,0.06)] text-white/90 border border-[rgba(255,255,255,0.08)]"
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                          <Streamdown>{m.content || (streaming && i === messages.length - 1 ? "…" : "")}</Streamdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-[rgba(255,255,255,0.06)] p-3 space-y-2 shrink-0 bg-[#050505]">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={streaming}
                  onClick={() => sendUserMessage(q)}
                  className="rounded-full border border-[rgba(204,255,0,0.25)] bg-[rgba(204,255,0,0.06)] px-2.5 py-1 text-[11px] text-[#ccff00] hover:bg-[rgba(204,255,0,0.12)] disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendUserMessage(input);
              }}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                rows={2}
                className="min-h-[52px] resize-none border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-white placeholder:text-white/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendUserMessage(input);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || streaming}
                className="h-[52px] w-11 shrink-0 bg-[#ccff00] text-black hover:bg-[#a0cc00]"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
