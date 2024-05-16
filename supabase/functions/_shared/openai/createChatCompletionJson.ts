import { openai } from "./client.ts";

export async function createChatCompletionJson(
  prompt: string,
  systemPrompt = "",
) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
      {
        role: "system",
        content: systemPrompt,
      },
    ],
    model: "gpt-4o",
    stream: false,
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  return chatCompletion.choices[0].message.content;
}
