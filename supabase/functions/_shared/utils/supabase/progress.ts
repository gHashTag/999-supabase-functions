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
): Promise<void | Response> {
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
): Promise<LastCallbackResult | Response | null> {
  try {
    const lessonResponse = await supabase
      .from(language)
      .select("lesson_number")
      .order("lesson_number", { ascending: false })
      .limit(1);

    if (lessonResponse.error) {
      throw new Error("Error getLastCallback: " + lessonResponse.error.message);
    }

    const lessonData = lessonResponse.data;

    if (!lessonData || lessonData.length === 0) {
      return null;
    }

    const largestLessonNumber = lessonData[0].lesson_number;

    const subtopicResponse = await supabase
      .from(language)
      .select("subtopic")
      .eq("lesson_number", largestLessonNumber)
      .order("subtopic", { ascending: false })
      .limit(1);

    if (subtopicResponse.error) {
      throw new Error(
        "Error getLastCallback: " + subtopicResponse.error.message,
      );
    }

    const subtopicData = subtopicResponse.data;

    if (!subtopicData || subtopicData.length === 0) {
      return null;
    }

    const largestSubtopic = subtopicData[0].subtopic;

    return { lesson_number: largestLessonNumber, subtopic: largestSubtopic };
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
      // Если запись существует, очищаем все поля, кроме user_id и created_at
      const { error: updateError } = await supabase
        .from("progress")
        .update({
          [language]: 0,
        })
        .eq("user_id", userId);

      if (updateError) throw new Error(updateError.message);
    }
  } catch (error) {
    throw new Error("Error resetProgress: " + error);
  }
}

export async function getCorrects(
  { user_id, language }: getCorrectsT,
): Promise<number | Response> {
  try {
    if (user_id !== undefined) {
      const response = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user_id)
        .single();

      if (response.error) {
        throw new Error("Error getCorrects: " + response.error.message);
      }

      if (!response.data) {
        throw new Error("User not found");
      }

      const correctAnswers = response.data[language];

      return correctAnswers;
    } else {
      console.error("user_id Type is undefined");
      return 0;
    }
  } catch (error) {
    throw new Error("Error getCorrects: " + error);
  }
}
