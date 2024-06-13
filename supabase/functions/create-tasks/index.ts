// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { Bot } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { translateText } from "../_shared/translateText.ts";

import { createChatCompletionJson } from "../_shared/openai/createChatCompletionJson.ts";

import { createEmoji } from "../_shared/openai/createEmoji.ts";

import { SITE_URL } from "../_shared/constants.ts";
import { bugCatcherRequest, supportRequest } from "../_shared/telegram/bots.ts";
import {
  createPassport,
  getPassportByRoomId,
} from "../_shared/supabase/passport.ts";
import { getRoomById } from "../_shared/supabase/rooms.ts";
import { PassportUser, TranscriptionAsset } from "../_shared/types/index.ts";
import { createTask, updateTaskByPassport } from "../_shared/supabase/tasks.ts";
import { getRoomAsset, setRoomAsset } from "../_shared/supabase/room_assets.ts";

import { getWorkspaceById } from "../_shared/supabase/workspaces.ts";
import { corsHeaders, headers } from "../_shared/handleCORS.ts";

type Task = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  title: string;
  description: string;
  chat_id: string;
};

interface SendTasksToTelegramT {
  username: string;
  first_name: string;
  last_name: string;
  translated_text: string;
  token: string;
  room_id: string;
  passports: PassportUser[];
}

async function sendTasksToTelegram({
  username,
  first_name,
  last_name,
  translated_text,
  token,
  passports,
}: SendTasksToTelegramT) {
  try {
    const assignee = username
      ? `${first_name} ${last_name || ""} (@${username})`
      : "";

    const bot = new Bot(token);

    await Promise.all(passports.map(async (passport) => {
      if (passport?.rooms?.chat_id) {
        let success = false;
        while (!success) {
          try {
            await bot.api.sendMessage(
              Number(passport.rooms.chat_id),
              `${translated_text}\n${assignee}`,
            );
            success = true;
          } catch (error) {
            if (error.error_code === 429) {
              const retryAfter = error.parameters.retry_after;
              console.log(
                `Rate limit exceeded. Retrying after ${retryAfter} seconds...`,
              );
              await new Promise((resolve) =>
                setTimeout(resolve, retryAfter * 1000)
              );
            } else {
              throw error;
            }
          }
        }
      }
    }));
  } catch (error) {
    await bugCatcherRequest("sendTasksToTelegram", error);
    throw new Error(`sendTasksToTelegram:${error}`);
  }
}

const getPreparedUsers = (usersFromSupabase: PassportUser[]) => {
  return usersFromSupabase.map((user: PassportUser) => {
    const concatName = () => {
      if (user?.first_name && !user?.last_name) return user?.first_name;
      if (!user?.first_name && user?.last_name) return user?.last_name;
      if (user.first_name && user.last_name) {
        return `${user?.first_name} ${user?.last_name}`;
      }
    };
    return { ...user, concat_name: concatName() };
  });
};

// @ts-ignore
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders, ...headers } });
  }
  const url = new URL(req.url);
  if (
    url.searchParams.get("secret") !==
      Deno.env.get("NEXT_PUBLIC_FUNCTION_SECRET")
  ) {
    return new Response("not allowed", { status: 405 });
  }

  const { type, data } = await req.json();
  console.log(type, "type");

  try {
    if (type === "transcription.success") {
      // new Response(
      //   JSON.stringify({
      //     message: "transcription.success",
      //   }),
      //   {
      //     status: 200,
      //     headers: { ...corsHeaders },
      //   },
      // );
      const recording_id = data.recording_id;
      if (!recording_id) throw new Error("recording_id is null");

      const { isExistRoomAsset } = await getRoomAsset(recording_id);
      console.log(isExistRoomAsset, "isExistRoomAsset");
      if (!isExistRoomAsset) {
        const transcriptTextPresignedUrl = data.transcript_txt_presigned_url;
        console.log(transcriptTextPresignedUrl, "transcriptTextPresignedUrl");

        const transcriptResponse = await fetch(transcriptTextPresignedUrl);
        console.log(transcriptResponse, "transcriptResponse");
        if (!transcriptResponse.ok) {
          await bugCatcherRequest(
            "create-tasks",
            "transcriptResponse is not ok",
          );
        }

        const transcription = await transcriptResponse.text();
        console.log(transcription, "transcription");
        if (!transcription) {
          await bugCatcherRequest(
            "create-tasks",
            "transcription is null",
          );
        }

        const summaryJsonPresignedUrl = data.summary_json_presigned_url;
        console.log(summaryJsonPresignedUrl, "summaryJsonPresignedUrl");
        if (!summaryJsonPresignedUrl) {
          await bugCatcherRequest(
            "create-tasks",
            "summaryJsonPresignedUrl is null",
          );
        }
        console.log(summaryJsonPresignedUrl, "summaryJsonPresignedUrl");

        const summaryJSONResponse = await fetch(summaryJsonPresignedUrl);
        console.log(summaryJSONResponse, "summaryJSONResponse");
        if (!summaryJSONResponse.ok) {
          await bugCatcherRequest(
            "create-tasks",
            "summaryJSONResponse is not ok",
          );
        }

        const summaryResponse = await summaryJSONResponse.json();
        console.log(summaryResponse, "summaryResponse");
        if (!summaryResponse.sections) {
          await bugCatcherRequest(
            "create-tasks",
            "summaryJSONResponse is not ok",
          );
        }

        const summarySection = summaryResponse.sections.find(
          (section: {
            title: string;
            format: string;
            bullets: string[];
            paragraph: string;
          }) => section.title === "Short Summary",
        );
        console.log(summarySection, "summarySection");
        if (!summarySection) {
          await bugCatcherRequest(
            "create-tasks",
            "summarySection is null",
          );
        }

        const summary_short = summarySection.paragraph;
        console.log(summary_short, "summary_short");

        if (!summary_short) {
          await bugCatcherRequest(
            "create-tasks",
            "summary_short is null",
          );
        }
        const titleWithEmoji = await createEmoji(
          summary_short,
        );
        console.log(titleWithEmoji, "titleWithEmoji");

        if (!titleWithEmoji) {
          await bugCatcherRequest(
            "create-tasks",
            "titleWithEmoji is null",
          );
        }

        if (!data.room_id) throw new Error("room_id is null");
        const users = await getPassportByRoomId(data.room_id);
        console.log(users, "users");

        if (!users) {
          await bugCatcherRequest(
            "create-tasks",
            "users is null",
          );
        }

        const roomAsset: TranscriptionAsset = {
          ...data,
          title: titleWithEmoji,
          summary_short,
          transcription,
          workspace_id: users[0].workspace_id,
          user_id: users[0].user_id,
        };
        console.log(roomAsset, "roomAsset");
        if (!roomAsset) {
          await bugCatcherRequest(
            "create-tasks",
            "roomAsset is null",
          );
        }
        await setRoomAsset(roomAsset);

        console.log(transcription, "transcription");

        const systemPrompt =
          `Answer with emoticons. You are an AI assistant working at dao999nft. Your goal is to extract all tasks from the text, the maximum number of tasks, the maximum number of tasks, the maximum number of tasks, the maximum number of tasks, the maximum number of tasks, assign them to executors using the colon sign: assignee, title,  description (Example: <b>Ai Koshey</b>: 💻 Develop functional requirements) If no tasks are detected, add one task indicating that no tasks were found. Provide your response as a JSON object`;

        const preparedTasks = await createChatCompletionJson(
          transcription,
          systemPrompt,
        );
        console.log(preparedTasks, "preparedTasks");
        if (!preparedTasks) {
          await bugCatcherRequest(
            "create-tasks",
            "preparedTasks is null",
          );
        }

        const preparedUsers = getPreparedUsers(users);
        console.log(preparedUsers, "preparedUsers");
        if (!preparedUsers) {
          await bugCatcherRequest(
            "create-tasks",
            "preparedUsers is null",
          );
        }

        const prompt = `add the 'user_id' from of ${
          JSON.stringify(
            preparedUsers,
          )
        } to the objects of the ${
          JSON.stringify(
            preparedTasks,
          )
        } array. (Example: [{
              user_id: "1a1e4c75-830c-4fe8-a312-c901c8aa144b",
              first_name: "Andrey",
              last_name: "O",
              username: "reactotron",
              photo_url: "https://avatars.githubusercontent.com/u/10137008?v=4",
              chat_id: 123456789,
              title: "🌌 Capture Universe",
              description: "Capture the Universe and a couple of stars in the Aldebaran constellation"
          }]) Provide your response as a JSON object and always response on English`;

        const tasks = await createChatCompletionJson(prompt);
        console.log(tasks, "tasks");
        if (!tasks) {
          await bugCatcherRequest(
            "create-tasks",
            "tasks is null",
          );
          throw new Error("tasks is null");
        }
        const tasksArray = JSON.parse(tasks).tasks;
        console.log(tasksArray, "tasksArray");

        if (!Array.isArray(tasksArray)) {
          await bugCatcherRequest("create-tasks", "tasksArray is not array");
          throw new Error("tasksArray is not array");
        }

        const newTasks = tasksArray.map((task: Task) => ({
          ...task,
          user_id: task.user_id || "e3939cb3-3198-4f52-8bfb-5728cc3dba84",
        }));
        console.log(newTasks, "newTasks");
        if (!newTasks) {
          await bugCatcherRequest(
            "create-tasks",
            "newTasks is null",
          );
          throw new Error("newTasks is null");
        }

        const { roomData, isExistRoom } = await getRoomById(data?.room_id);
        console.log(roomData, "roomData");
        console.log(isExistRoom, "isExistRoom");
        if (!isExistRoom || !roomData) {
          await bugCatcherRequest(
            "create-tasks",
            "Room not found",
          );
          throw new Error("Room not found");
        }

        const { language_code, id, token, description } = roomData;

        const workspace_id = description;
        console.log(workspace_id, "workspace_id");
        if (!id) {
          await bugCatcherRequest(
            "create-tasks",
            "id is null",
          );
          throw new Error("id is null");
        }
        if (!workspace_id) {
          await bugCatcherRequest(
            "create-tasks",
            "workspace_id is null",
          );
          throw new Error("workspace_id is null");
        }
        if (!token) {
          await bugCatcherRequest(
            "create-tasks",
            "token is null",
          );
          throw new Error("token is null");
        }

        const workspace = await getWorkspaceById(workspace_id);
        let workspace_name;
        if (workspace) {
          workspace_name = workspace[0].title;
        }
        console.log(workspace_name, "workspace_name");
        if (!workspace_name) throw new Error("workspace_name is null");

        const { room_id, recording_id } = data;
        if (!room_id) throw new Error("room_id is null");
        if (!recording_id) throw new Error("recording_id is null");
        let translated_short = summary_short;
        console.log(translated_short, "translated_short");

        if (language_code !== "en") {
          translated_short = await translateText(
            summary_short,
            language_code,
          );
        }

        const translatedTasks = language_code !== "en"
          ? await Promise.all(newTasks.map(async (task) => {
            const translated_text = await translateText(
              `${task.title}\n${task.description}`,
              language_code,
            );

            return {
              ...task,
              translated_text,
            };
          }))
          : newTasks.map((task) => ({
            ...task,
            translated_text: `${task.title}\n${task.description}`,
          }));
        console.log(translatedTasks, "translatedTasks");

        const passports = await getPassportByRoomId(room_id);
        console.log(passports, "passports");
        if (!passports) throw new Error("passports is null");

        await supportRequest(
          `transcription.success,\nrecording_id: ${data.recording_id},\nroom_id: ${data.room_id},\ntranscript_txt_presigned_url: ${data.transcript_txt_presigned_url},\nsummary_json_presigned_url: ${data.summary_json_presigned_url}`,
          {
            username: passports[0].username,
          },
        );

        for (const passport of passports) {
          const summary_short_url =
            `${SITE_URL}/${passport.username}/${passport.user_id}/${workspace_id}/${room_id}/${recording_id}`;

          console.log(summary_short_url, "summary_short_url");
          console.log(token, "token");

          const bot = new Bot(token);
          console.log(bot, "bot");

          const buttons = [
            {
              text: language_code === "ru" ? "Открыть встречу" : "Open meet",
              url: summary_short_url,
              web_app: {
                url: summary_short_url,
              },
            },
          ];
          if (!passport.rooms?.chat_id) throw new Error("chat_id is null");
          console.log(passport.rooms?.chat_id, "passport.rooms?.chat_id");
          await bot.api.sendMessage(
            Number(passport.rooms?.chat_id),
            `🚀 ${translated_short}`,
            {
              reply_markup: {
                inline_keyboard: [buttons],
              },
            },
          );
        }

        for (const task of translatedTasks) {
          // Убедитесь, что userId существует и не равен null
          const user_id = task?.user_id;
          console.log(data.room_id, "data.room_id");
          const taskData = await createTask({
            user_id,
            room_id: data.room_id,
            workspace_id,
            recording_id: data.recording_id,
            title: task.title,
            description: task.description,
            workspace_name,
            chat_id: roomData.chat_id,
            translated_text: task.translated_text,
          });
          console.log(taskData, "taskData");
          const result = await createPassport({
            type: "task",
            select_izbushka: id,
            first_name: task.first_name,
            last_name: task.last_name,
            username: task.username,
            user_id: task.user_id,
            is_owner: true,
            task_id: taskData.id,
            recording_id,
          });
          console.log(result, "result");
          if (!result.passport_id) throw new Error("passport_id is null");

          const updateTaskData = await updateTaskByPassport({
            id: taskData.id,
            passport_id: result.passport_id,
          });
          console.log(updateTaskData, "updateTaskData");

          await sendTasksToTelegram({
            username: task.username,
            first_name: task.first_name,
            last_name: task.last_name,
            translated_text: task.translated_text,
            token,
            room_id: data.room_id,
            passports,
          }).catch(console.error);
        }
        return new Response(
          JSON.stringify({
            message: "Event processed successfully",
          }),
          {
            status: 200,
            headers: { ...corsHeaders },
          },
        );
      } else {
        return new Response(
          JSON.stringify({
            message: "isExistRoomAsset true",
          }),
          {
            status: 200,
            headers: { ...corsHeaders },
          },
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          message: "type is not equal to transcription.success",
        }),
        {
          status: 200,
          headers: { ...corsHeaders },
        },
      );
    }
  } catch (err) {
    await bugCatcherRequest("create-tasks", JSON.stringify(err));
    return new Response(
      JSON.stringify({ message: "Error: " + err }),
      {
        status: 500,
        headers: { ...corsHeaders },
      },
    );
  }

  //return new Response("Endpoint not found", { status: 404 });
});

// const transcriptionText =
//   `Dmitrii Vasilev: Thats it. Let's go. So, the first task is to create bots that go to the Moon. The second task is to create bots that go to Mars. The third task is to create bots that go to Venus and colonize them by building a lunar base there. What do you add, Andrey?

// Andrey O: Yes, one more task. After we colonize the lunar base, we will need to capture the Universe and the last task in the Aldebaran constellation will also need to capture a couple of stars in this colony.

// Dmitrii Vasilev: So, we need to understand who will solve this problem through us. Who will not be delegated?

// Andrey O: I think that the last task can be delegated to the head of the transport department.

// Dmitrii Vasilev: Andrey O. `;

// supabase functions deploy create-tasks --no-verify-jwt
