import { model_ai } from "../constants.ts";
import { openai } from "../openai/client.ts";
import GPT3Tokenizer from "https://esm.sh/gpt3-tokenizer@1.1.5";
import { getAiFeedbackT, getAiSupabaseFeedbackT } from "../types/index.ts";
import { supabase, supabaseInvoke } from "./index.ts";

export const tokenizer = new GPT3Tokenizer({ type: "gpt3" });

export const model = new Supabase.ai.Session("gte-small");

interface EmbeddingResponse {
  embeddings: string;
}

export const embeddingResponse = async (
  input: string,
): Promise<unknown> => {
  try {
    const response = await model.run(input, {
      mean_pool: true,
      normalize: true,
    });

    if (!response) {
      throw new Error("Invalid response from model.run");
    }
    return response;
  } catch (error) {
    throw new Error(`Error embedding response: ${error}`);
  }
};

type getCompletionT = {
  prompt: string;
  assistantPrompt: string;
  systemPrompt: string;
};
export const getCompletion = async (
  { prompt, assistantPrompt, systemPrompt }: getCompletionT,
) => {
  try {
    const response = await openai.chat.completions.create({
      model: model_ai,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: assistantPrompt },
        { role: "system", content: systemPrompt },
      ],
      temperature: 0.6,
    });

    const ai_content = response.choices[0].message.content;
    console.log(ai_content, "ai_content");
    // if (ai_content === "[]") {
    //   if (!ai_content) throw new Error("ai_content is null");
    // }

    return {
      id: response.id,
      ai_content,
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
    language_code,
  }: getAiSupabaseFeedbackT,
): Promise<{ ai_content: string; tasks: Task[]; data: any }> {
  try {
    const { data } = await supabase.functions.invoke("ask-data", {
      body: JSON.stringify({
        query,
        id_array,
        username,
        language_code,
      }),
    });

    return {
      ai_content: data.ai_content,
      tasks: data.tasks,
      data,
    };
  } catch (error) {
    throw new Error(`Error receiving AI response: ${error}`);
  }
}

export const matchEmbeddingIds = async (
  id_array: number[],
  embeddingUser: unknown,
) => {
  try {
    const { data, error } = await supabaseInvoke
      .rpc("query_embeddings_tasks_with_ids", {
        id_array,
        embedding_vector: JSON.stringify(embeddingUser),
        match_threshold: 0.4,
      })
      .select("*")
      .limit(4);

    if (error) {
      throw new Error(
        `Error matching matchEmbeddingIds: ${error}`,
      );
    }
    return data;
  } catch (error) {
    throw new Error(
      `Error matching embedding ask data: ${JSON.stringify(error)}`,
    );
  }
};

export const matchEmbedding = async (
  rpc_function_name: string,
  embedding: unknown,
  search_username: string,
) => {
  try {
    const { data, error } = await supabaseInvoke
      .rpc(rpc_function_name, {
        embedding_vector: JSON.stringify(embedding),
        match_threshold: 0.4,
        match_count: 9,
        search_username,
      })
      .select("*")
      .limit(9);

    if (error) {
      throw new Error(
        `Error matching matchEmbedding: ${JSON.stringify(error)}`,
      );
    }

    return data;
  } catch (error) {
    throw new Error(`Error matching embedding: ${error}`);
  }
};
