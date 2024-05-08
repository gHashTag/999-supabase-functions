import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts";

export const botAiKoshey = new Bot(
  Deno.env.get("TELEGRAM_BOT_TOKEN_AI_KOSHEY") || "",
);

export const handleUpdateAiKoshey = webhookCallback(botAiKoshey, "std/http");
