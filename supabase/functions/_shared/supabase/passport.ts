import { bugCatcherRequest } from "../telegram/bots.ts";
import {
  CheckPassportIsExistingResult,
  CheckPassportResult,
  PassportUser,
  UserPassport,
} from "../types/index.ts";
import { supabase } from "./index.ts";

export async function setPassport(
  passport: PassportUser,
): Promise<string | Response> {
  try {
    const { data, error } = await supabase
      .from("user_passport")
      .insert(passport)
      .select("*");

    if (error) {
      await bugCatcherRequest("setPassport", error);
      throw new Error("Error setPassport: " + error);
    }

    const passport_id = data && data[0].passport_id;
    return passport_id;
  } catch (error) {
    await bugCatcherRequest("setPassport", error);
    throw new Error("Error setPassport: " + error);
  }
}

interface CreatePassport {
  type: "room" | "task" | "workspace";
  select_izbushka: number;
  first_name: string;
  last_name: string;
  username: string;
  user_id: string;
  is_owner: boolean;
  recording_id: string;
  task_id: string;
}

export async function createPassport({
  type,
  select_izbushka,
  first_name,
  last_name,
  username,
  user_id,
  is_owner,
  task_id,
  recording_id,
}: CreatePassport): Promise<CheckPassportResult> {
  try {
    const { data: dataRoom, error: errorRoom } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", select_izbushka)
      .single();
    console.log(dataRoom, "dataRoom");
    if (errorRoom) {
      await bugCatcherRequest("createPassport", errorRoom);
      throw new Error(errorRoom.message);
    }

    const passport: UserPassport[] = [
      {
        username,
        user_id,
        workspace_id: dataRoom.workspace_id,
        room_id: dataRoom.room_id,
        first_name,
        last_name,
        type,
        is_owner,
        task_id,
        recording_id,
        photo_url: "",
        chat_id: dataRoom.chat_id,
      },
    ];
    console.log(passport, "checkPassport passport");
    const { data: dataPassport, error: errorPassport } = await supabase
      .from("user_passport")
      .insert(passport)
      .select("*");
    console.log(dataPassport, "checkPassport dataPassport");
    if (errorPassport) {
      await bugCatcherRequest("createPassport", errorPassport);
      throw new Error(errorPassport.message);
    }
    return {
      passport: dataPassport,
      passport_id: dataPassport[0].passport_id,
    };
  } catch (error) {
    await bugCatcherRequest("createPassport", error);
    throw new Error("throw createPassport: " + error);
  }
}

export const checkPassport = async (
  user_id: string,
  workspace_id: string,
  room_id: string,
  task_id?: string,
): Promise<CheckPassportIsExistingResult> => {
  try {
    console.log(
      user_id,
      workspace_id,
      room_id,
      task_id,
      "user_id, workspace_id, room_id, task_id",
    );
    const { data: existingPassport, error } = await supabase
      .from("user_passport")
      .select("*")
      .eq("user_id", user_id)
      .eq("workspace_id", workspace_id)
      .eq("room_id", room_id)
      .eq("task_id", task_id)
      .eq("is_owner", false).single();
    console.log(existingPassport, "existingPassport");
    if (error) {
      await bugCatcherRequest("checkPassport", error);
      throw new Error("Error checkPassport: " + error);
    }
    if (existingPassport) {
      return {
        isExistingPassport: true,
        passport: existingPassport,
        passport_id: existingPassport.passport_id,
      };
    } else {
      return {
        isExistingPassport: false,
      };
    }
  } catch (error) {
    await bugCatcherRequest("checkPassport", error);
    throw new Error("Error checkPassport: " + error);
  }
};

export async function getPassportByRoomId(
  room_id: string,
): Promise<PassportUser[]> {
  try {
    const { data, error } = await supabase
      .from("user_passport")
      .select(`
      *,
      rooms(chat_id)
    `)
      .eq("room_id", room_id)
      .eq("type", "room")
      .eq("is_owner", true);

    if (error) {
      await bugCatcherRequest("getPassportByRoomId", error);
    }

    if (data === null) {
      await bugCatcherRequest(
        "getPassportByRoomId",
        "No data returned from select",
      );
      throw new Error("No data returned from select");
    }

    return data;
  } catch (error) {
    await bugCatcherRequest("getPassportByRoomId", error);
    throw new Error("Error getPassportByRoomId: " + error);
  }
}

export async function getPassportsTasksByUsername(
  username: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("user_passport")
      .select("*")
      .eq("username", username)
      .eq("type", "task");

    if (error) {
      await bugCatcherRequest("getPassportsTasksByUsername", error);
      throw new Error(
        "Error getPassportsTasksByUsername: " + JSON.stringify(error),
      );
    }

    return data.map((item) => item.task_id);
  } catch (error) {
    await bugCatcherRequest("getPassportsTasksByUsername", error);
    throw new Error("Error getPassportsTasksByUsername: " + error);
  }
}

export async function checkPassportByRoomId(
  user_id: string,
  room_id: string,
  type: "room" | "task" | "workspace",
): Promise<boolean | Response> {
  try {
    const { data, error } = await supabase
      .from("user_passport")
      .select("*")
      .eq("user_id", user_id)
      .eq("room_id", room_id)
      .eq("type", type);

    if (error) {
      await bugCatcherRequest("checkPassportByRoomId", error);
      throw new Error("Error checkPassportByRoomId: " + error);
    }

    return data && data.length > 0;
  } catch (error) {
    await bugCatcherRequest("checkPassportByRoomId", error);
    throw new Error("Error checkPassportByRoomId: " + error);
  }
}
