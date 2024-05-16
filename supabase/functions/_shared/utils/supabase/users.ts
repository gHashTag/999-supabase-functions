import {
  CheckAndReturnUserResult,
  CheckUsernameCodesResult,
  SupabaseResponse,
  SupabaseUser,
  UserContext,
  UserData,
} from "../types/index.ts";
import { supabase } from "./index.ts";

export async function createUser(
  ctx: UserContext,
): Promise<UserData[] | Response | void> {
  try {
    const { first_name, last_name, username, is_bot, language_code, id } =
      ctx.update.message.from;

    const { data: existingUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", id)
      .maybeSingle();

    if (error && error.message !== "No rows found") {
      throw new Error("Error checking user existence: " + error);
    }

    if (existingUser) {
      return;
    }

    // Если пользователя нет, создаем нового
    const usersData: UserData = {
      first_name,
      last_name,
      username,
      is_bot,
      language_code,
      telegram_id: id,
      email: "",
      photo_url: "",
    };

    const { data, error: insertError } = await supabase
      .from("users")
      .insert([usersData]);

    if (insertError) {
      throw new Error("Error when creating user: " + insertError);
    }
    if (data === null) {
      throw new Error("No data returned from insert");
    }
    return data;
  } catch (error) {
    throw new Error("Error createUser: " + error);
  }
}

export const getSupabaseUser = async (
  username: string,
): Promise<SupabaseUser | null | Response> => {
  try {
    const response = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (response.error && response.error.code === "PGRST116") {
      console.error("getSupabaseUser: User not found");
      return null;
    }

    if (response.error) {
      console.error(
        "Error getting user information:",
        response.error,
      );
      return null;
    }

    return response.data;
  } catch (error) {
    throw new Error("Error getSupabaseUser: " + error);
  }
};

export const createUserInDatabase = async (
  newUser: SupabaseUser,
): Promise<SupabaseUser | null | Response> => {
  try {
    await supabase.from("users").insert([newUser]);
    const user = await getSupabaseUser(newUser.username || "");
    console.log(user, "user");
    return user;
  } catch (error) {
    throw new Error("Error createUserInDatabase: " + error);
  }
};

export async function getUid(
  username: string,
): Promise<string  | null> {
  try {
    // Запрос к таблице users для получения user_id по username
    const response = await supabase
      .from("users")
      .select("user_id")
      .eq("username", username)
      .single();

    if (response.error) {
      throw new Error("Error getUid: " + response.error.message);
    }

    if (!response.data) {
      console.error("User not found");
      return null; // или выбросить ошибку, если пользователь должен существовать
    }

    // Возвращаем user_id
    return response.data.user_id;
  } catch (error) {
    throw new Error("Error getUid: " + error);
  }
}

export const getUser = async (
  username: string,
): Promise<SupabaseUser[] | Response> => {
  try {
    const response = await supabase
      .from("users")
      .select("*")
      .eq("username", username);

    if (response.error) {
      throw new Error("Error getUser: " + response.error.message);
    }

    return response.data;
  } catch (error) {
    throw new Error("Error getUser: " + error);
  }
};

export const checkUsername = async (
  username: string,
): Promise<boolean | Response> => {
  try {
    const response: SupabaseResponse<SupabaseUser[]> = await supabase
      .from("users")
      .select("*")
      .eq("username", username);

    if (response.error) {
      console.error(response.error, "error checkUsername");
      return false;
    }

    return response.data ? response.data.length > 0 : false;
  } catch (error) {
    throw new Error("Error checkUsername: " + error);
  }
};

export const checkUsernameAndReturnUser = async (
  username: string,
): Promise<CheckAndReturnUserResult> => {
  try {
    const response = await supabase
      .from("users")
      .select("*")
      .eq("username", username);

    if (response.error) {
      console.error(response.error, "error checkUsername");
      return {
        isUserExist: false,
        user: null,
      };
    }

    return {
      isUserExist: response.data ? response.data.length > 0 : false,
      user: response.data ? response.data[0] : null,
    };
  } catch (error) {
    throw new Error("Error checkUsernameAndReturnUser: " + error);
  }
};

export async function checkAndReturnUser(
  username: string,
): Promise<{ isUserExist: boolean; user: SupabaseUser | null }> {
  try {
    const response = await supabase
      .from("users")
      .select("*")
      .eq("username", username);

    if (response.error) {
      console.log(response.error, "error checkUsername");
      return {
        isUserExist: false,
        user: null,
      };
    }

    const user = response.data && response.data.length > 0
      ? response.data[0]
      : null;

    return {
      isUserExist: user !== null,
      user,
    };
  } catch (error) {
    throw new Error("Error checkAndReturnUser: " + error);
  }
}

export const checkUsernameCodes = async (
  username: string,
): Promise<CheckUsernameCodesResult> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username);

    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .eq("username", username);

    if (roomsError) {
      throw new Error("Error checkUsernameCodes: " + roomsError);
    }
    const invitation_codes = rooms && rooms[0]?.codes;

    if (userError) {
      return {
        isInviterExist: false,
        invitation_codes: "",
        error: true,
        inviter_user_id: "",
      };
    }

    return {
      isInviterExist: userData && userData.length > 0,
      invitation_codes,
      error: false,
      inviter_user_id: userData ? userData[0].user_id : "",
    };
  } catch (error) {
    throw new Error("Error checkUsernameCodes: " + error);
  }
};

export const setSelectedIzbushka = async (
  username: string,
  select_izbushka: string,
): Promise<SupabaseUser[][] | Response> => {
  try {
    const { data, error }: SupabaseResponse<SupabaseUser[]> = await supabase
      .from("users")
      .update({ select_izbushka })
      .eq("username", username)
      .select("*");

    if (error) {
      throw new Error("Error setSelectedIzbushka: " + error);
    }

    return data || [];
  } catch (error) {
    throw new Error("Error setSelectedIzbushka: " + error);
  }
};
