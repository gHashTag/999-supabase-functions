import { bugCatcherRequest } from "../telegram/bots.ts";
import { supabase } from "./index.ts";

interface CreateTask {
  user_id: string;
  room_id: string;
  workspace_id: string;
  recording_id: string;
  title: string;
  description: string;
  workspace_name: string;
  chat_id: number;
  translated_text: string;
}

export type TaskStatus = "todo" | "in_progress" | "done" | "archived";

export type TaskNode = {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  description: string;
  updated_at?: string;
  due_date?: string;
  priority?: string;
  assigned_to?: string;
  label?: string[];
  completed_at?: string;
  is_archived?: boolean;
  status: TaskStatus;
  order: number;
  background: string;
  colors: string[][];
  type: string;
  workspace_id: string;
  cost: string;
  is_public: boolean;
  translated_text: string;
};

export const createTask = async ({
  user_id,
  room_id,
  workspace_id,
  recording_id,
  title,
  description,
  workspace_name,
  chat_id,
  translated_text,
}: CreateTask): Promise<TaskNode> => {
  try {
    const { data: taskData, error: taskError } = await supabase.from("tasks")
      .insert([
        {
          user_id,
          room_id,
          workspace_id,
          recording_id,
          title,
          description,
          workspace_name,
          chat_id,
          translated_text,
        },
      ]).select("*");

    if (taskError) {
      await bugCatcherRequest("createTask", taskError);
      throw new Error("Error createTask: " + taskError);
    }

    if (!taskData || taskData.length === 0) {
      await bugCatcherRequest("createTask", "Task not found");
      throw new Error("Task not found");
    }

    return taskData[0];
  } catch (error) {
    await bugCatcherRequest("createTask", error);
    throw new Error("Error createTask: " + error);
  }
};

export const updateTaskByPassport = async ({
  id,
  passport_id,
}: {
  id: string;
  passport_id: string;
}) => {
  console.log(id, "id");
  console.log(passport_id, "passport_id");

  const { data: updateTaskData, error: updateTaskError } = await supabase
    .from("tasks")
    .update({ passport_id })
    .eq("id", id)
    .select("*");

  if (updateTaskError) {
    await bugCatcherRequest("updateTaskByPassport", updateTaskError);
    throw new Error("Error updateTaskByPassport: " + updateTaskError);
  }

  return updateTaskData;
};
