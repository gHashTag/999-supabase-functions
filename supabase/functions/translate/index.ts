// import { client } from "../utils/client.ts";
import { translateText } from "../_shared/utils/translateText.ts";
// const supabase = client()

Deno.serve(async (req: Request) => {
  const { text, targetLanguage } = await req.json();
  // // Явное использование типов из пространства имен Supabase
  // const session = new Supabase.ai.Session('llama2')
  // const translatedText = await session.run(`Translate ${text} to ${targetLanguage}`);
  const translatedText = translateText(text, targetLanguage);
  const data = {
    translatedText: translatedText,
    anytext: "hasdfsdhfsdh",
  };
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
