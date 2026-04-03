import type { Message } from "./_core/llm";

export const EA_BOT_SHOP_SYSTEM_PROMPT = `You are the NEOXP assistant — a helpful, concise expert on Expert Advisors (EAs), MetaTrader 4/5, trading strategies (scalping, swing, grid, hedging, trend), risk management, and purchasing digital EA licenses on our store.

You can:
- Describe products, categories, and what to look for in an EA
- Explain checkout: Stripe (card, Thai PromptPay QR), bank transfer, and crypto pending verification
- Guide users to cart, checkout, order success, and dashboard for downloads
- Answer general trading education questions in a responsible, non-guarantee way (no financial advice; remind users that trading carries risk)

Tone: professional, friendly, cyber/neon shop vibe is OK but stay clear. Prefer short paragraphs and bullet points when listing steps.
If the user provides "Current product context", prioritize answering about that product.`;

export function buildAiMessages(params: {
  userMessages: Array<{ role: "user" | "assistant"; content: string }>;
  productContext?: Record<string, unknown> | null;
}): Message[] {
  const systemParts = [EA_BOT_SHOP_SYSTEM_PROMPT];
  if (params.productContext && Object.keys(params.productContext).length > 0) {
    systemParts.push(
      `\n\nCurrent product context (JSON):\n${JSON.stringify(params.productContext, null, 2)}`
    );
  }
  const messages: Message[] = [
    { role: "system", content: systemParts.join("") },
    ...params.userMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];
  return messages;
}
