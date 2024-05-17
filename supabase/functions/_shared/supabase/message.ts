import { supabase } from "./index.ts";

interface MessageObject {
  user_id: string;
  username: string;
  workspace_id: string;
  room_id: string;
  content: string;
}

export const setMessage = async (messageObject: MessageObject) => {
  try {
    const { data: dataMessage, error: errorMessage } = await supabase
      .from("messages")
      .insert(messageObject);
    console.log(dataMessage, "dataMessage");
    if (errorMessage) {
      throw new Error(`Error setMessage: ${errorMessage}`);
    }
    return dataMessage;
  } catch (error) {
    console.log(error, "error");
  }
};
