import { client } from "./client.ts";

interface QuestionContext {
  lesson_number?: number;
  subtopic?: number;
}

interface updateProgressContext {
  user_id: string;
  isTrue: boolean;
  language: string;
}

interface UpdateResultParams {
  user_id: string;
  language: string;
  value: boolean;
}

interface getBiggestT {
  lesson_number: number;
  language: string;
}

interface getQuestionT {
  ctx: QuestionContext;
  language: string;
}

interface resetProgressT {
  username: string;
  language: string;
}

interface getCorrectsT {
  user_id: string;
  language: string;
}
export type SupabaseUser = TUser & {
  user_id: string;
  inviter?: string | null;
  is_bot?: boolean | null;
  language_code?: string | null;
  telegram_id?: number | null;
  email?: string | null;
  created_at?: Date;
  aggregateverifier?: string | null;
  admin_email?: string | null;
  role?: string | null;
  display_name?: string | null;
};

export type TUser = Readonly<{
  auth_date?: number;
  first_name: string;
  last_name?: string;
  hash?: string;
  id?: number;
  photo_url?: string;
  username?: string;
}>;

if (!Deno.env.get("SUPABASE_URL")) {
  throw new Error("SUPABASE_URL is not set");
}

if (!Deno.env.get("SUPABASE_ANON_KEY")) {
  throw new Error("SUPABASE_ANON_KEY is not set");
}

const supabase = client();

export async function getWorkspaceById(workspace_id: string) {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("workspace_id", workspace_id);
  console.log(error, "error");
  return data;
}

export async function getWorkspaceByName(name: string) {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("name", name);
  console.log(error, "error");
  return data;
}

export async function setMyWorkspace(user_id: string) {
  const { data, error } = await supabase.from("workspaces").insert([
    {
      title: "Fire",
      user_id,
    },
  ]);
  console.log(error, "setMyWorkspace error:::");
  return data;
}

type userCtx = {
  update: {
    message: {
      from: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        is_bot: boolean;
        language_code: string;
      };
    };
  };
};

export async function createUser(ctx: any) {
  const { first_name, last_name, username, is_bot, language_code, id } =
    ctx.update.message.from;

  // Проверяем, существует ли уже пользователь с таким telegram_id
  const { data: existingUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", id)
    .maybeSingle();

  if (error && error.message !== "No rows found") {
    console.error("Ошибка при проверке существования пользователя:", error);
    return;
  }

  if (existingUser) {
    return;
  }
  // Если пользователя нет, создаем нового
  const usersData = {
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
    console.error("Ошибка при создании пользователя:", insertError);
    return;
  }

  return data;
}

export async function createRoom(username: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("username", username);

  if (error) {
    console.error(error, "error createRoom");
  }
  return data;
}

export const checkPassport = async (
  user_id: string,
  workspace_id: string,
  room_id: string,
  task_id?: string,
) => {
  const { data: existingPassport, error } = await supabase
    .from("user_passport")
    .select("*")
    .eq("user_id", user_id)
    .eq("workspace_id", workspace_id)
    .eq("room_id", room_id)
    .eq("task_id", task_id)
    .eq("is_owner", false);

  if (error) {
    console.error("Error checking passport:", error);
    return null;
  }

  return {
    isExistingPassport: existingPassport.length > 0,
    passport: existingPassport,
    passport_id: existingPassport.length > 0
      ? existingPassport[0].passport_id
      : null,
  };
};

export async function getPassportByRoomId(
  room_id: string,
) {
  const { data, error } = await supabase.from("user_passport").select("*").eq(
    "room_id",
    room_id,
  ).eq("type", "room");

  if (error) console.log("getPassportByRoomId error:::", error);

  return data;
}

export async function checkPassportByRoomId(
  user_id: string,
  room_id: string,
  type: "room" | "task" | "workspace",
) {
  const { data, error } = await supabase.from("user_passport").select("*").eq(
    "user_id",
    user_id,
  ).eq("room_id", room_id).eq("type", type);

  if (error) console.log("checkPassportByRoomId error:::", error);

  return data && data.length > 0;
}

export async function setPassport(passport: any) {
  const { data, error } = await supabase.from("user_passport").insert(
    passport,
  ).select("*");

  if (error) console.log("setPassport error:::", error);
  const passport_id = data && data[0].passport_id;
  return passport_id;
}

export async function createPassport(
  type: "room" | "task" | "workspace",
  select_izbushka: string,
  first_name: string,
  last_name: string,
  username: string,
  user_id: string,
  task_id?: string,
) {
  console.log(select_izbushka, "select_izbushka");
  const { data: dataRoom, error: errorRoom } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", select_izbushka)
    .single();

  if (errorRoom) {
    console.error(errorRoom, "error getRoom");
    throw new Error(errorRoom.message);
  }

  const passportObj = await checkPassport(
    user_id,
    dataRoom.workspace_id,
    dataRoom.room_id,
    task_id,
  );

  if (passportObj) {
    return {
      isExistingPassport: true,
      passport_id: passportObj?.passport_id,
      passport: passportObj?.passport,
    };
  } else {
    const passport = [
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
      console.error(errorPassport, "error passport");
      throw new Error(errorPassport.message);
    }

    return {
      isExistingPassport: true,
      dataPassport,
      passport_id: dataPassport[0].passport_id,
    };
  }
}

export async function getBiggest(
  { lesson_number, language }: getBiggestT,
): Promise<number | null> {
  const { data, error } = await supabase
    .from(language)
    .select("subtopic")
    .eq("lesson_number", lesson_number)
    .order("subtopic", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const result = data.length > 0 ? data[0].subtopic : null;
  return result;
}

export async function getQuestion({ ctx, language }: getQuestionT) {
  console.log(ctx);
  // Проверяем, предоставлены ли lesson_number и subtopic
  if (ctx.lesson_number == null || ctx.subtopic == null) {
    console.error("getQuestion требует lesson_number и subtopic");
    return []; // Возвращаем пустой массив или выбрасываем ошибку
  }

  const { lesson_number, subtopic } = ctx;

  const { data, error } = await supabase
    .from(language)
    .select("*")
    .eq("lesson_number", lesson_number)
    .eq("subtopic", subtopic);

  if (error) {
    console.log(error, "error supabase getQuestion");
    throw new Error(error.message);
  }

  return data;
}

export async function resetProgress(
  { username, language }: resetProgressT,
): Promise<void> {
  // Получаем user_id по username из таблицы users
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("user_id")
    .eq("username", username)
    .single();

  console.log(userData, "userData");
  if (userError || !userData) {
    throw new Error(userError?.message || "User not found");
  }

  const userId = userData.user_id;

  // Проверяем, существует ли запись в таблице javascript_progress для данного user_id
  const { data: progressData, error: progressError } = await supabase
    .from("progress")
    .select("user_id")
    .eq("user_id", userId);

  if (progressError) throw new Error(progressError.message);

  if (progressData && progressData.length === 0) {
    // Если записи нет, создаем новую
    const { error: insertError } = await supabase
      .from("progress")
      .insert([{ user_id: userId }]);

    if (insertError) throw new Error(insertError.message);
  } else {
    // Если запись существует, очищаем все поля, кроме user_id и created_at
    const { error: updateError } = await supabase
      .from("progress")
      .update({
        [language]: 0,
      })
      .eq("user_id", userId);

    if (updateError) throw new Error(updateError.message);
  }
}

export const getSupabaseUser = async (username: string) => {
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
    console.error("Error getting user information:", error);
    return null;
  }
};

export const createUserInDatabase = async (
  newUser: SupabaseUser,
): Promise<{ user_id: string }> => {
  await supabase.from("users").insert([newUser]);
  const user = await getSupabaseUser(newUser.username || "");
  console.log(user, "user");
  return user;
};

export async function getCorrects(
  { user_id, language }: getCorrectsT,
): Promise<number> {
  if (user_id !== undefined) {
    // Запрос к базе данных для получения данных пользователя
    const { data, error } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (error) {
      console.error("Error fetching data:", error);
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("User not found");
    }
    // Подсчет количества true значений
    const correctAnswers = data[language];

    return correctAnswers;
  } else {
    console.error("user_id Type is undefined");
    return 0;
  }
}

export async function updateProgress(
  { user_id, isTrue, language }: updateProgressContext,
): Promise<void> {
  const { data: progressData, error: progressError } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", user_id);

  if (progressError) throw new Error(progressError.message);

  if (progressData && progressData.length === 0) {
    const { error: insertError } = await supabase
      .from("progress")
      .insert([{ user_id: user_id }]);

    if (insertError) throw new Error(insertError.message);
  } else {
    const { error: updateError } = await supabase
      .from("progress")
      .update({
        [language]: isTrue
          ? progressData[0][language] + 1
          : progressData[0][language],
      })
      .eq("user_id", user_id);

    const { error: allError } = await supabase
      .from("progress")
      .update({ all: isTrue ? progressData[0].all + 1 : progressData[0].all })
      .eq("user_id", user_id);

    if (updateError) throw new Error(updateError.message);
    if (allError) throw new Error(allError.message);
  }
}

export async function updateResult(
  { user_id, language, value }: UpdateResultParams,
): Promise<void> {
  const { data, error } = await supabase
    .from("result")
    .upsert({ user_id, [language]: value }, { onConflict: "user_id" });

  if (error) {
    console.error("Error updating result:", error);
    throw error;
  }

  console.log("Result successfully updated or inserted:", data);
}

export async function getUid(username: string) {
  // Запрос к таблице users для получения user_id по username
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("username", username)
    .single();

  if (error) {
    console.error("Error getting user_id:", error.message);
    throw new Error(error.message);
  }

  if (!data) {
    console.error("User not found");
    return null; // или выбросить ошибку, если пользователь должен существовать
  }

  // Возвращаем user_id
  return data.user_id;
}

export async function getLastCallback(language: string) {
  const { data: lessonData, error: lessonError } = await supabase
    .from(language)
    .select("lesson_number")
    .order("lesson_number", { ascending: false })
    .limit(1);

  if (lessonError) {
    throw new Error(lessonError.message);
  }

  if (lessonData.length === 0) {
    return null;
  }

  const largestLessonNumber = lessonData[0].lesson_number;

  const { data: subtopicData, error: subtopicError } = await supabase
    .from(language)
    .select("subtopic")
    .eq("lesson_number", largestLessonNumber)
    .order("subtopic", { ascending: false })
    .limit(1);

  if (subtopicError) {
    throw new Error(subtopicError.message);
  }

  if (subtopicData.length === 0) {
    return null;
  }

  const largestSubtopic = subtopicData[0].subtopic;

  return { lesson_number: largestLessonNumber, subtopic: largestSubtopic };
}

export const getUser = async (username: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username);
  if (error) {
    console.error(error, "error getUser");
  }
  return data;
};

export const checkUsername = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username);
  if (error) {
    console.error(error, "error checkUsername");
    return false;
  }
  return data ? data.length > 0 : false;
};

export const checkUsernameAndReturnUser = async (
  username: string,
): Promise<{
  isUserExist: boolean;
  user: SupabaseUser;
}> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username);

  if (error) {
    console.error(error, "error checkUsername");
    return {
      isUserExist: false,
      user: {} as SupabaseUser,
    };
  }
  return {
    isUserExist: data ? data.length > 0 : false,
    user: data[0],
  };
};

export const getSelectIzbushkaId = async (selectIzbushka: string) => {
  const { data: dataIzbushka, error: selectIzbushkaError } = await supabase
    .from(
      "rooms",
    ).select("*").eq("id", selectIzbushka);

  const izbushka = dataIzbushka && dataIzbushka[0];

  if (izbushka) {
    return { dataIzbushka, izbushka, selectIzbushkaError: null };
  } else {
    return { dataIzbushka: [], izbushka: null, selectIzbushkaError };
  }
};

export async function checkAndReturnUser(
  username: string,
): Promise<{
  isUserExist: boolean;
  user: SupabaseUser;
}> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username);

  if (error) {
    console.log(error, "error checkUsername");
    return {
      isUserExist: false,
      user: {} as SupabaseUser,
    };
  }
  return {
    isUserExist: data ? data.length > 0 : false,
    user: data[0],
  };
}

export const checkUsernameCodes = async (
  username: string,
): Promise<{
  isInviterExist: boolean;
  invitation_codes: string;
  inviter_user_id: string;
  error?: boolean;
}> => {
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
      console.error(roomsError, "roomsError");
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
      isInviterExist: userData.length > 0 ? true : false,
      invitation_codes,
      inviter_user_id: userData[0].user_id,
    };
  } catch (error) {
    console.error(error, "error checkUsernameCodes");
    return {
      isInviterExist: false,
      invitation_codes: "",
      error: true,
      inviter_user_id: "",
    };
  }
};

export const getRooms = async (username: string) => {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("username", username);

  if (error) {
    console.error(error, "error getRooms");
  }
  return data;
};

export const getRoomsWater = async (username: string) => {
  const { data, error } = await supabase
    .from("user_passport")
    .select(`*, rooms(id, name, chat_id, type, codes)`)
    .eq("username", username)
    .eq("is_owner", false)
    .eq("type", "room");

  if (error) {
    console.error(error, "error getRooms water");
  }
  const transformedArray = data?.map((item) => ({
    ...item,
    ...item.rooms,
    rooms: undefined,
  }));
  return transformedArray;
};

export const getRoomsCopperPipes = async () => {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("public", true);

  if (error) {
    console.error(error, "error getRooms copper pipes");
  }
  return data;
};
export const setSelectedIzbushka = async (
  username: string,
  select_izbushka: string,
) => {
  const {
    data,
    error,
  } = await supabase
    .from("users")
    .update({ select_izbushka })
    .eq("username", username)
    .select("*");

  if (error) {
    console.error(
      error,
      "updateUserSelectIzbushkaError",
    );
  }

  if (error) {
    console.error(error, "error getRooms copper pipes");
  }
  return data;
};

export { supabase };
