import { TranscriptionAsset } from "../types/index.ts";
import { supabase } from "./index.ts";

export const setRoomAsset = async (
  roomAsset: TranscriptionAsset,
) => {
  try {
    const { data: roomAssetData, error: errorInsertRoomAsset } = await supabase
      .from("room_assets")
      .insert([roomAsset]);

    if (errorInsertRoomAsset) {
      throw new Error(
        `Asset creation failed: ${errorInsertRoomAsset.message}`,
      );
    }

    if (errorInsertRoomAsset) {
      throw new Error("Error setRoomAsset: " + errorInsertRoomAsset);
    }

    return roomAssetData;
  } catch (error) {
    throw new Error("Error setRoomAsset: " + error);
  }
};

export const getRoomAsset = async (
  recording_id: string,
): Promise<{
  roomAssetData: TranscriptionAsset[];
  isExistRoomAsset: boolean;
}> => {
  try {
    const { data: roomAssetData, error: errorGetRoomAsset } = await supabase
      .from("room_assets")
      .select("*")
      .eq("recording_id", recording_id)
      .single();
    console.log(roomAssetData, "roomAssetData");
    if (errorGetRoomAsset) {
      if (errorGetRoomAsset.code === "PGRST116") {
        return {
          roomAssetData: [],
          isExistRoomAsset: false,
        };
      }
      throw new Error(
        "Error getRoomAsset: " + JSON.stringify(errorGetRoomAsset),
      );
    }
    return {
      roomAssetData: roomAssetData === null ? [] : roomAssetData,
      isExistRoomAsset: roomAssetData === null ? false : true,
    };
  } catch (error) {
    throw new Error("Error getRoomAsset: " + error);
  }
};
