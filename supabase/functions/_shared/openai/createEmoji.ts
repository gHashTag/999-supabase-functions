import { model_ai } from "../constants.ts";
import { openai } from "./client.ts";

const systemPrompt =
  `create a very short title with an emoji at the beginning of this text`;

export async function createEmoji(
  prompt: string,
) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{
      role: "user",
      content: prompt,
    }, {
      role: "system",
      content: systemPrompt,
    }],
    model: model_ai,
    stream: false,
    temperature: 0.1,
  });

  return chatCompletion.choices[0].message.content;
}
