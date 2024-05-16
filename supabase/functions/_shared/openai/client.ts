import OpenAI from "https://deno.land/x/openai@v4.28.0/mod.ts";

export const apiKey = Deno.env.get("OPENAI_API_KEY");
export const openai = new OpenAI({ apiKey });
