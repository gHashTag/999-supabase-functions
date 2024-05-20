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
): Promise<string | null | Response> {
  try {
    const { data, error }: SupabaseResponse<{ subtopic: string }> =
      await supabase
        .from(language)
        .select("subtopic")
        .eq("lesson_number", lesson_number)
        .order("subtopic", { ascending: false })
        .limit(1)
        .single();

    if (error) {
      throw new Error("Error getBiggest: " + error.message);
    }

    const result = data && data.length > 0 ? data[0].subtopic : null;
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
        .single();

      console.log(dataCorrects, "dataCorrects");
      console.log(errorCorrects, "errorCorrects");

      if (errorCorrects !== null) {
        throw new Error("Error getCorrects: " + errorCorrects.message);
      }

      if (!dataCorrects) {
        throw new Error("User not found");
      }

      const correctAnswers = dataCorrects[language];

      return correctAnswers;
    } else {
      console.error("user_id Type is undefined");
      throw 0;
    }
  } catch (error) {
    throw new Error("Error getCorrects(254): " + error);
  }
}
