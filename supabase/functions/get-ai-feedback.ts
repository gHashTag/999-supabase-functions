import { supabase } from "./_shared/utils/supabase/index.ts";
import { getAiFeedbackT } from "./_shared/utils/types/index.ts";

interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export async function getAiFeedbackFromSupabase(
  { query }: getAiFeedbackT,
): Promise<{ content: string; tasks: Task[]; data: any }> {
  try {
    const { data } = await supabase.functions.invoke("ask-data", {
      body: JSON.stringify({ query }),
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
