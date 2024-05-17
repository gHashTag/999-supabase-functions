import { model_ai } from "../constants.ts";
import { openai } from "../openai/client.ts";
import GPT3Tokenizer from "https://esm.sh/gpt3-tokenizer@1.1.5";
import { getAiFeedbackT, getAiSupabaseFeedbackT } from "../types/index.ts";
import { supabase } from "./index.ts";

export const tokenizer = new GPT3Tokenizer({ type: "gpt3" });

export const model = new Supabase.ai.Session("gte-small");

export const embeddingResponse = async (input: string) =>
  await model.run(input, {
    mean_pool: true,
    normalize: true,
  });

export const getCompletion = async (prompt: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: model_ai,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    return {
      id: response.id,
      ai_content: response.choices[0].message.content,
      error: null,
    };
  } catch (error) {
    console.error("Error getting completion:", error);
    throw error;
  }
};

export async function getAiFeedback(
  { query, endpoint, token }: getAiFeedbackT,
) {
  const response = await fetch(
    endpoint,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ question: query }),
    },
  );
  console.log(response, "response");
  const result = await response.json();
  return result.text;
}

interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export async function getAiFeedbackFromSupabase(
  {
    query,
    id_array,
    username,
  }: getAiSupabaseFeedbackT,
): Promise<{ content: string; tasks: Task[]; data: any }> {
  try {
    const { data } = await supabase.functions.invoke("ask-data", {
      body: JSON.stringify({
        query,
        id_array,
        username,
      }),
    });

    console.log(data, "data");
    return {
      content: data.content,
      tasks: data.tasks,
      data,
    };
  } catch (error) {
    throw new Error(`Error receiving AI response: ${error}`);
  }
}
