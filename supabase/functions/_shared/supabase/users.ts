import {
  CheckAndReturnUserResult,
  CheckUsernameCodesResult,
  SupabaseResponse,
  SupabaseUser,
  TUser,
  UserContext,
  UserData,
  UserProfile,
} from "../types/index.ts";
import { supabase } from "./index.ts";

export async function createUser(
  ctx: UserContext,
): Promise<UserData[] | Response | void> {
  try {
    const { first_name, last_name, username, is_bot, language_code, telegram_id } =
      ctx;

    const { data: existingUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegram_id)
      .maybeSingle();
      console.log(existingUser, "existingUser")
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
      telegram_id,
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
    console.log(data, "data createUser")
    return data;
  } catch (error) {
    throw new Error("Error createUser: " + error);
  }
}

export async function updateUser(telegram_id: string, updates: any): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("telegram_id", telegram_id)
      .select("*"); // Добавлено .select("*")

    if (error) {
      throw new Error("Error updating user: " + error.message);
    }

    if (!data) {
      throw new Error("No data returned from update");
    }
  } catch (error) {
    throw new Error("Error updateUser: " + error);
  }
}

export async function askNextQuestion(ctx: any, userId: string) {
  const user = await getUser(userId);

  if (user.company === null) {
    await ctx.reply("Пожалуйста, укажите вашу компанию:");
  } else if (user.position === null) {
    await ctx.reply("Пожалуйста, укажите вашу должность:");
  } else if (user.designation === null) {
    await ctx.reply("Пожалуйста, укажите описание ваших навыков и интересов:");
  } else {
    await updateUser(userId, { is_question: false });
    await ctx.reply("Ваш профиль заполнен!");
  }
}

export async function updateUserProfile(profile: UserProfile): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        company: profile.company,
        position: profile.position,
        designation: `${profile.description}\n\n${profile.interests}`,
      })
      .eq("username", profile.username);

    if (error) {
      throw new Error("Error updating user profile: " + error.message);
    }

    if (!data) {
      throw new Error("No data returned from update");
    }
  } catch (error) {
    throw new Error("Error updateUserProfile: " + error);
  }
}

export const getSupabaseUser = async (
  username: string,
): Promise<SupabaseUser> => {
  try {
    const response = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (response.error && response.error.code === "PGRST116") {
      console.error("getSupabaseUser: User not found");
      throw new Error("User not found");
    }

    if (response.error) {
      console.error(
        "Error getting user information:",
        response.error,
      );
      throw new Error("Error getting user information");
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
): Promise<string | null> {
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

interface UserWithFullName {
  data: TUser;
  position: string;
  designation: string;
  full_name: string;
  iq_question: boolean;
  company: string;
}

export const getUser = async (
  username: string,
): Promise<UserWithFullName> => {
  try {
    const response = await supabase
      .from("users")
      .select("*")
      .eq("username", username);

    if (response.error) {
      throw new Error("Error getUser: " + response.error.message);
    }

    return {
      data: response.data[0],
      position: response.data[0].position,
      designation: response.data[0].designation,
      full_name: `${response.data[0].first_name} ${response.data[0].last_name}`,
      iq_question: response.data[0].iq_question,
      company: response.data[0].company,
    };
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
  telegram_id: string,
): Promise<{ isUserExist: boolean; user?: SupabaseUser }> {
  try {
    const response = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegram_id);

    if (response.error) {
      console.log(response.error, "error checkAndReturnUser");
      return {
        isUserExist: false,
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
    console.log("🙋‍♂️checkUsernameCodes", username);
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username);
    console.log(userData, "userData");

    if (userData && userData.length === 0) {
      return {
        isInviterExist: false,
        invitation_codes: "",
        error: true,
        inviter_user_id: "",
      };
    }
    
    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .eq("username", username);

    if (roomsError) {
      throw new Error("(314)Error checkUsernameCodes: " + roomsError);
    }
    console.log(rooms, "rooms");
    console.log(rooms[0]?.codes, "rooms[0]?.codes");
    const invitation_codes = rooms && rooms[0]?.codes;
    console.log(invitation_codes, "invitation_codes");
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
    throw new Error("(334)Error checkUsernameCodes: " + error);
  }
};

export const setSelectedIzbushka = async (
  telegram_id: string,
  select_izbushka: string,
): Promise<SupabaseUser[][] | Response> => {
  try {
    const { data, error }: SupabaseResponse<SupabaseUser[]> = await supabase
      .from("users")
      .update({ select_izbushka })
      .eq("telegram_id", telegram_id)
      .select("*");

      console.log(data, "363 data setSelectedIzbushka")
    if (error) {
      throw new Error("Error setSelectedIzbushka: " + error);
    }

    return data || [];
  } catch (error) {
    throw new Error("Error setSelectedIzbushka: " + error);
  }
};

export async function getUsernameByTelegramId(telegram_id: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("telegram_id", telegram_id)
      .single();

    if (error) {
      throw new Error("Error getUsernameByTelegramId: " + error);
    }

    return data?.username || null;
  } catch (error) {
    throw new Error("Error getUsernameByTelegramId: " + error);
  }
};

export const setLanguage = async (
  telegram_id: string,
  language: string,
): Promise<SupabaseUser[][] | Response> => {
  try {
    const { data, error }: SupabaseResponse<SupabaseUser[]> = await supabase
      .from("users")
      .update({ language })
      .eq("telegram_id", telegram_id)
      .select("*");

    console.log(data, "data setLanguage");
    if (error) {
      throw new Error("Error setLanguage: " + error);
    }

    return data || [];
  } catch (error) {
    throw new Error("Error setLanguage: " + error);
  }
};

export async function getLanguage(telegram_id: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("language")
      .eq("telegram_id", telegram_id)
      .single();

    if (error) {
      throw new Error("Error getLanguage: " + error);
    }

    return data?.language || null;
  } catch (error) {
    throw new Error("Error getLanguage: " + error);
  }
}
