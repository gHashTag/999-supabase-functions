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
      throw new Error("Error getRoomById: " + errorInsertRoomAsset);
    }

    return roomAssetData;
  } catch (error) {
    throw new Error("Error getRoomById: " + error);
  }
};
