import {
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
      throw new Error("Error setPassport: " + error);
    }

    const passport_id = data && data[0].passport_id;
    return passport_id;
  } catch (error) {
    throw new Error("Error setPassport: " + error);
  }
}

interface CreatePassport {
  type: "room" | "task" | "workspace";
  select_izbushka: string;
  first_name: string;
  last_name: string;
  username: string;
  user_id: string;
  task_id?: string;
}

export async function createPassport({
  type,
  select_izbushka,
  first_name,
  last_name,
  username,
  user_id,
  task_id,
}: CreatePassport): Promise<CheckPassportResult> {
  try {
    const { data: dataRoom, error: errorRoom } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", select_izbushka)
      .single();
    console.log(dataRoom, "dataRoom");
    if (errorRoom) {
      throw new Error("Error createPassport: " + errorRoom);
    }

    const passportObj = await checkPassport(
      user_id,
      dataRoom.workspace_id,
      dataRoom.room_id,
      task_id,
    );
    console.log(passportObj, "passportObj");
    if (passportObj) {
      return {
        isExistingPassport: true,
        passport_id: passportObj.passport_id,
        passport: passportObj.passport,
      };
    } else {
      const passport: UserPassport[] = [
        {
          username,
          user_id,
          workspace_id: dataRoom.workspace_id,
          room_id: dataRoom.room_id,
          first_name,
          last_name,
          type,
          is_owner: false,
          photo_url: "",
          chat_id: dataRoom.chat_id,
        },
      ];

      const { data: dataPassport, error: errorPassport } = await supabase
        .from("user_passport")
        .insert(passport)
        .select("*");
      console.log(dataPassport, "dataPassport");
      if (errorPassport) {
        throw new Error(errorPassport.message);
      }

      return {
        isExistingPassport: true,
        passport: dataPassport,
        passport_id: dataPassport[0].passport_id,
      };
    }
  } catch (error) {
    throw new Error("Error createPassport: " + error);
  }
}

export const checkPassport = async (
  user_id: string,
  workspace_id: string,
  room_id: string,
  task_id?: string,
): Promise<CheckPassportResult> => {
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
      .eq("is_owner", false);
    console.log(existingPassport, "existingPassport");
    if (error) {
      throw new Error("Error checkPassport: " + error);
    } else {
      return {
        isExistingPassport: existingPassport.length > 0,
        passport: existingPassport,
        passport_id: existingPassport[0]?.passport_id,
      };
    }
  } catch (error) {
    throw new Error("Error checkPassport: " + error);
  }
};

export async function getPassportByRoomId(
  room_id: string,
): Promise<UserPassport[]> {
  try {
    const { data, error } = await supabase.from("user_passport")
      .select("*")
      .eq("room_id", room_id)
      .eq("type", "room");

    if (error) {
      throw new Error("Error getPassportByRoomId: " + error);
    }

    if (data === null) {
      throw new Error("No data returned from select");
    }

    return data;
  } catch (error) {
    throw new Error("Error getPassportByRoomId: " + error);
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
      throw new Error("Error checkPassportByRoomId: " + error);
    }

    return data && data.length > 0;
  } catch (error) {
    throw new Error("Error checkPassportByRoomId: " + error);
  }
}
