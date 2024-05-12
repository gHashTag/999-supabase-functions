/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { translateText } from "../utils/translateText.ts";

Deno.serve(async (req: Request) => {
  const { text, targetLanguage } = await req.json();
  const translatedText = await translateText(text, targetLanguage)
  const data = {
    translatedText
  }
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
