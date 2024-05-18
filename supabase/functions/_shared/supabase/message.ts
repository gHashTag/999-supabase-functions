import { supabase } from "./index.ts";

interface MessageObject {
  user_id: string;
  username: string;
  workspace_id: string;
  room_id: string;
  content: string;
  ai_content: string;
  embedding: string;
}

export const setMessage = async (messageObject: MessageObject) => {
  try {
    const { data: dataMessage, error: errorMessage } = await supabase
      .from("messages")
      .insert(messageObject)
      .select(
        "id, user_id, workspace_id, room_id, created_at, content, ai_content",
      );

    if (errorMessage) {
      throw new Error(`Error setMessage: ${errorMessage}`);
    }
    console.log(dataMessage, "dataMessage");
    return dataMessage;
  } catch (error) {
    console.log(error, "error");
  }
};
