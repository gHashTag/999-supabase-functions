import {
  getBiggestT,
  getCorrectsT,
  getQuestionT,
  LastCallbackResult,
  resetProgressT,
  SupabaseResponse,
  updateProgressContext,
  UpdateResultParams,
} from "../types/index.ts";
import { supabase } from "./index.ts";

export async function updateProgress(
  { user_id, isTrue, language }: updateProgressContext,
): Promise<void> {
  try {
    const response = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", user_id);

    if (response.error) throw new Error(response.error.message);

    const progressData = response.data;

    if (progressData && progressData.length === 0) {
      const { error: insertError } = await supabase
        .from("progress")
        .insert([{ user_id: user_id }]);

      if (insertError) throw new Error(insertError.message);
    } else if (progressData) {
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
  } catch (error) {
    throw new Error("Error updateProgress: " + error);
  }
}

export async function updateResult(
  { user_id, language, value }: UpdateResultParams,
): Promise<void> {
  try {
    const response: SupabaseResponse<null> = await supabase
      .from("result")
      .upsert({ user_id, [language]: value }, { onConflict: "user_id" });

    if (response.error) {
      console.log(response.error, "response.error");
      throw new Error("Error updateResult: " + response.error);
    }

    console.log("Result successfully updated or inserted:", response.data);
  } catch (error) {
    throw new Error("Error updateResult: " + error);
  }
}

export async function getLastCallback(
  language: string,
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from(language)
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw new Error("Error getLastCallback: " + error.message);
    }

    if (!data) {
      return null;
    }

    return data.id;
  } catch (error) {
    throw new Error("Error getLastCallback: " + error);
  }
}

export async function getBiggest(
  { lesson_number, language }: getBiggestT,
): Promise<string | null> {
  try {
    const { data, error } =
      await supabase
        .from(language)
        .select("subtopic")
        .eq("lesson_number", lesson_number)
        .order("subtopic", { ascending: false })
        .limit(1)
        .single();
    console.log(data, "data getBiggest");
    if (error) {
      throw new Error("Error getBiggest: " + error.message);
    }
    if (!data || !data.subtopic) {
      throw new Error("Error getBiggest: data is null or subtopic is undefined");
    }
    const result = data.subtopic;
    console.log(result, "result getBiggest");
    return result;
  } catch (error) {
    throw new Error("Error getBiggest: " + error);
  }
}

export async function getQuestion(
  { ctx, language }: getQuestionT,
): Promise<any[]> {
  try {
    console.log(ctx);
    // Проверяем, предоставлены ли lesson_number и subtopic
    if (ctx.lesson_number == null || ctx.subtopic == null) {
      throw new Error("Error getQuestion: lesson_number or subtopic is null");
    }

    const { lesson_number, subtopic } = ctx;

    const { data, error }: SupabaseResponse<any> = await supabase
      .from(language)
      .select("*")
      .eq("lesson_number", lesson_number)
      .eq("subtopic", subtopic);

    if (error) {
      throw new Error("Error getQuestion: " + error.message);
    }

    return data || [];
  } catch (error) {
    throw new Error("Error getQuestion: " + error);
  }
}

export async function resetProgress(
  { username, language }: resetProgressT,
): Promise<Response | void> {
  try {
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

    // Проверяем, существует ли запись в таблице progress для данного user_id
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
      const { data: dataProgress, error: errorProgress } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (errorProgress) throw new Error(errorProgress.message);

      const allReset = dataProgress.all - dataProgress[language];

      const { error: resetError } = await supabase
        .from("progress")
        .update({
          [language]: 0,
          all: allReset,
        })
        .eq("user_id", userId);

      if (resetError) throw new Error(resetError.message);
    }
  } catch (error) {
    throw new Error("Error resetProgress: " + error);
  }
}

export async function getCorrects(
  { user_id, language }: getCorrectsT,
): Promise<number> {
  try {
    if (user_id !== undefined) {
      const { data: dataCorrects, error: errorCorrects } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle();

      console.log(dataCorrects, "dataCorrects");
      console.log(errorCorrects, "errorCorrects");

      if (errorCorrects !== null) {
        throw new Error("Error getCorrects: " + errorCorrects.message);
      }

      if (!dataCorrects) {
        // Создаем новую строку с user_id
        const { error: insertError } = await supabase
          .from("progress")
          .insert([{ user_id: user_id, [language]: 0, all: 0 }]);

        if (insertError) {
          throw new Error("Error inserting new progress: " + insertError.message);
        }

        return 0; // Возвращаем 0, так как это новая запись
      }

      console.log(dataCorrects, "dataCorrects");
      const correctAnswers = dataCorrects[language];

      return correctAnswers;
    } else {
      throw new Error("user_id Type is undefined");
    }
  } catch (error) {
    throw new Error("Error getCorrects(254): " + error);
  }
}

export async function getTop10Users(): Promise<any[]> {
  try {
    const { data: topUsers, error: topUsersError } = await supabase
      .from("progress")
      .select("user_id, all")
      .order("all", { ascending: false })
      .limit(10);

    if (topUsersError) {
      throw new Error("Error fetching top users: " + topUsersError.message);
    }

    const userIds = topUsers.map((user) => user.user_id);

    const { data: userInfo, error: userInfoError } = await supabase
      .from("users")
      .select("username, user_id")
      .in("user_id", userIds);

    if (userInfoError) {
      throw new Error("Error fetching user info: " + userInfoError.message);
    }
    console.log(userInfo, "userInfo")

    const result = topUsers.map((user) => {
      const userInfoData = userInfo.find((info) => info.user_id === user.user_id);
      return {
        username: userInfoData?.username,
        all: user.all,
      };
    });

    console.log(result)
    return result;
  } catch (error) {
    throw new Error("Error getTop10Users: " + error);
  }
}
