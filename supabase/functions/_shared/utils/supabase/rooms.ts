import { supabase } from "./index.ts";
import {
  RoomNode,
  SelectIzbushkaError,
  SupabaseResponse,
} from "../types/index.ts";

export const getRoomById = async (
  room_id: string,
) => {
  try {
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_id", room_id);

    if (roomError) {
      throw new Error("Error getRoomById: " + roomError);
    }

    if (!roomData || roomData.length === 0) {
      console.log("Room not found");
      return [];
    }

    return roomData[0];
  } catch (error) {
    throw new Error("Error getRoomById: " + error);
  }
};

export const getRoomsWater = async (
  username: string,
): Promise<RoomNode[]> => {
  try {
    const { data, error } = await supabase
      .from("user_passport")
      .select(`*, rooms(id, name, chat_id, type, codes)`)
      .eq("username", username)
      .eq("is_owner", false)
      .eq("type", "room");

    if (error) {
      throw new Error("Error getRooms water: " + error);
    }

    const transformedArray = data?.map((item) => ({
      ...item,
      ...item.rooms,
      rooms: undefined,
    }));

    return transformedArray || [];
  } catch (error) {
    throw new Error("Error getRooms water: " + error);
  }
};

export const getRooms = async (
  username: string,
): Promise<RoomNode[]> => {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("username", username);

    if (error) {
      throw new Error("Error getRooms: " + error);
    }
    return data || [];
  } catch (error) {
    throw new Error("Error getRooms: " + error);
  }
};

export const getRoomsCopperPipes = async (): Promise<RoomNode[]> => {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("public", true);

    if (error) {
      throw new Error("Error getRooms copper pipes: " + error);
    }

    return data;
  } catch (error) {
    console.error(error, "error getRooms copper pipes");
    throw new Error("Error getRooms copper pipes: " + error);
  }
};

export const getSelectIzbushkaId = async (
  selectIzbushka: string,
): Promise<
  {
    izbushka: RoomNode | null;
    selectIzbushkaError: SelectIzbushkaError | null;
    dataIzbushka: RoomNode[] | null;
  }
> => {
  try {
    const response: SupabaseResponse<RoomNode> = await supabase
      .from("rooms")
      .select("*")
      .eq("id", selectIzbushka);

    const izbushka = response.data ? response.data[0] : null;

    if (izbushka) {
      return {
        dataIzbushka: response.data,
        izbushka,
        selectIzbushkaError: null,
      };
    } else {
      return {
        dataIzbushka: [],
        izbushka: null,
        selectIzbushkaError: response.error,
      };
    }
  } catch (error) {
    console.error(error, "error getSelectIzbushkaId");
    throw new Error("Error getSelectIzbushkaId: " + error);
  }
};

export async function createRoom(
  username: string,
): Promise<RoomNode[]> {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("username", username);

    if (error) {
      console.error(error, "error createRoom");
    }

    if (data === null) {
      throw new Error("No data returned from select");
    }

    return data;
  } catch (error) {
    console.error(error, "error createRoom");
    throw new Error("Error createRoom: " + error);
  }
}
