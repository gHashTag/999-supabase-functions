// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { client, getWorkspaceById } from "../_shared/utils/supabase/index.ts";
import { Bot } from "https://deno.land/x/grammy@v1.22.4/mod.ts";
import { translateText } from "../_shared/utils/translateText.ts";

import { createChatCompletionJson } from "../_shared/utils/createChatCompletionJson.ts";
import { corsHeaders } from "../_shared/corsHeaders.ts";
import { headers } from "../_shared/headers.ts";
import { createEmoji } from "../_shared/utils/createEmoji.ts";

import { SITE_URL } from "../_shared/utils/constants.ts";
import { supportRequest } from "../_shared/utils/telegram/bots.ts";
import {
  createPassport,
  getPassportByRoomId,
} from "../_shared/utils/supabase/passport.ts";
import { getRoomById } from "../_shared/utils/supabase/rooms.ts";
import { PassportUser } from "../_shared/utils/types/index.ts";
import {
  createTask,
  updateTaskByPassport,
} from "../_shared/utils/supabase/tasks.ts";

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
  const assignee = username === null
    ? ""
    : `${first_name} ${last_name || ""} (@${username})`;

  if (passports && passports.length > 0) {
    const bot = new Bot(token);
    for (const passport of passports) {
      await bot.api.sendMessage(
        passport.chat_id,
        `${translated_text}\n${assignee}`,
      );
    }
  }
}

const getPreparedUsers = (usersFromSupabase: PassportUser[]) => {
  return usersFromSupabase.map((user: PassportUser) => {
    const concatName = () => {
      if (!!user.first_name && !user.last_name) {
        return user?.first_name;
      }
      if (!user.first_name && !!user.last_name) {
        return user.last_name;
      }
      if (!!user.first_name && !!user.last_name) {
        return `${user?.first_name} ${user?.last_name}`;
      }
    };
    return {
      ...user,
      concat_name: concatName(),
    };
  });
};

Deno.serve(async (req: Request) => {
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
    const supabaseClient = client();

    if (type === undefined) {
      return new Response(
        JSON.stringify({
          message: "type is undefined",
        }),
        {
          status: 200,
          headers: { ...corsHeaders },
        },
      );
    }

    if (type === "transcription.success") {
      console.log(data, "data transcription.success");
      if (!data.room_id) {
        return new Response(
          JSON.stringify({
            message: `check init data ${JSON.stringify(data)}`,
          }),
          {
            status: 200,
            headers: { ...corsHeaders },
          },
        );
      } else {
        // Получаем прямую ссылку на текстовый файл транскрипции
        const transcriptTextPresignedUrl = data.transcript_txt_presigned_url;

        await supportRequest("transcription.success", data);

        // Выполняем запрос к URL для получения текста транскрипции
        const transcriptResponse = await fetch(transcriptTextPresignedUrl);

        const transcription = await transcriptResponse.text();

        const summaryJsonPresignedUrl = data.summary_json_presigned_url;

        const summaryJSONResponse = await fetch(summaryJsonPresignedUrl);
        if (!summaryJSONResponse.ok) {
          throw new Error("Не удалось получить transcriptJSONResponse");
        }
        const summaryResponse = await summaryJSONResponse.json();
        console.log(summaryResponse, "summaryResponse");
        const summarySection = summaryResponse.sections.find(
          (section: {
            title: string;
            format: string;
            bullets: string[];
            paragraph: string;
          }) => section.title === "Short Summary",
        );
        console.log(summarySection, "summarySection");
        const summary_short = summarySection ? summarySection.paragraph : "";

        const titleWithEmoji = await createEmoji(
          summary_short,
        );

        const roomAsset = {
          ...data,
          title: titleWithEmoji,
          summary_short,
          transcription,
        };
        console.log(roomAsset, "roomAsset");
        const { error: errorInsertRoomAsset } = await supabaseClient
          .from("room_assets")
          .insert([roomAsset]);

        if (errorInsertRoomAsset) {
          throw new Error(
            `Asset creation failed: ${errorInsertRoomAsset.message}`,
          );
        }

        const systemPrompt =
          `Answer with emoticons. You are an AI assistant working at dao999nft. Your goal is to extract all tasks from the text, the maximum number of tasks, the maximum number of tasks, the maximum number of tasks, the maximum number of tasks, the maximum number of tasks, assign them to executors using the colon sign: assignee, title,  description (Example: <b>Ai Koshey</b>: 💻 Develop functional requirements) If no tasks are detected, add one task indicating that no tasks were found. Provide your response as a JSON object`;

        const preparedTasks = await createChatCompletionJson(
          transcription,
          systemPrompt,
        );
        console.log(preparedTasks, "preparedTasks");

        const { data: users } = await supabaseClient.from("user_passport")
          .select("*").eq("room_id", data.room_id).eq("type", "room");

        console.log(users, "user_passport");
        if (users) {
          const preparedUsers = getPreparedUsers(users);
          console.log(preparedUsers, "preparedUsers");

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

          // console.log(preparedTasks, "preparedTasks");
          const tasks = await createChatCompletionJson(prompt);
          const tasksArray = tasks && JSON.parse(tasks).tasks;
          console.log(tasksArray, "tasksArray");

          const roomData = await getRoomById(data.room_id);

          if (Array.isArray(tasksArray)) {
            const newTasks = tasksArray.map((task: Task) => {
              // Если user_id отсутствует или пуст, присваиваем значение по умолчанию
              if (!task.user_id) {
                task.user_id = "28772cec-eba4-4375-a5a1-090bba2909fa";
              }
              return task;
            });
            const roomData = await getRoomById(data.room_id);
            console.log(roomData, "roomData");
            const { language_code, id, token, description } = roomData;

            const workspace_id = description;
            console.log(workspace_id, "workspace_id");

            const workspace = await getWorkspaceById(workspace_id);

            let workspace_name;
            if (workspace) {
              workspace_name = workspace[0].title;
            } else {
              // Обработка случая, когда объект равен null или пустой
              return new Response( // строка 217
                JSON.stringify({ message: "workspace_name is null" }),
                { status: 200, headers: { ...corsHeaders } },
              );
            }
            console.log(workspace_name, "workspace_name");
            const { room_id, recording_id } = data;
            let translated_short = summary_short;
            if (room_id) {
              console.log(translated_short, "translated_short");

              if (language_code !== "en") {
                translated_short = await translateText(
                  summary_short,
                  language_code,
                );
              }
            }
            console.log(language_code, "language_code");
            const translatedTasks = language_code !== "en"
              ? await Promise.all(newTasks.map(async (task) => {
                const translated_text = await translateText(
                  `${task.title}\n${task.description}`,
                  language_code,
                );
                console.log(translated_text, "translated_text");
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
            for (const passport of passports) {
              const summary_short_url =
                `${SITE_URL}/${passport.username}/${passport.user_id}/${workspace_id}/${room_id}/${recording_id}`;

              console.log(summary_short_url, "summary_short_url");
              const bot = new Bot(token);
              await bot.api.sendMessage(
                passport.chat_id,
                `🚀 ${translated_short}`,
                {
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: language_code === "ru"
                            ? "Открыть встречу"
                            : "Open meet",
                          url: summary_short_url,
                        },
                      ],
                    ],
                  },
                },
              );
            }
            if (workspace_name) {
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
                if (result.passport_id) {
                  const updateTaskData = await updateTaskByPassport({
                    id: taskData.id,
                    passport_id: result.passport_id,
                  });
                  console.log(updateTaskData, "updateTaskData");

                  await sendTasksToTelegram({
                    username: roomData.username,
                    first_name: task.first_name,
                    last_name: task.last_name,
                    translated_text: task.translated_text,
                    token,
                    room_id: data.room_id,
                    passports,
                  }).catch(console.error);
                }
              }
            }
          } else {
            return new Response(
              JSON.stringify({
                message: "workspace_name is null",
              }),
              {
                status: 200,
                headers: { ...corsHeaders },
              },
            );
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
        }
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
    console.error(err);
    return new Response(
      JSON.stringify({ message: "Error: " + err }),
      {
        status: 500,
        headers: { ...corsHeaders },
      },
    );
  }
  return new Response("Endpoint not found", { status: 404 });
});

// const transcriptionText =
//   `Dmitrii Vasilev: Thats it. Let's go. So, the first task is to create bots that go to the Moon. The second task is to create bots that go to Mars. The third task is to create bots that go to Venus and colonize them by building a lunar base there. What do you add, Andrey?

// Andrey O: Yes, one more task. After we colonize the lunar base, we will need to capture the Universe and the last task in the Aldebaran constellation will also need to capture a couple of stars in this colony.

// Dmitrii Vasilev: So, we need to understand who will solve this problem through us. Who will not be delegated?

// Andrey O: I think that the last task can be delegated to the head of the transport department.

// Dmitrii Vasilev: Andrey O. `;

// supabase functions deploy create-tasks --no-verify-jwt
