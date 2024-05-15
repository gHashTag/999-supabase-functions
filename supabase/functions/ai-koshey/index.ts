console.log(`Function "ai_kochey_bot" up and running!`);

import {
  Context,
  GrammyError,
  HttpError,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";

import { getAiFeedbackFromSupabase } from "../get-ai-feedback.ts";
import { delay, FUNCTION_SECRET } from "../_shared/utils/constants.ts";
import { createUser } from "../_shared/utils/nextapi/index.ts";
import {
  aiKosheyUrl,
  botAiKoshey,
  botUsername,
  handleUpdateAiKoshey,
} from "../_shared/utils/telegram/bots.ts";
import {
  checkAndReturnUser,
  checkUsernameCodes,
  setSelectedIzbushka,
} from "../_shared/utils/supabase/users.ts";
import {
  getRooms,
  getRoomsCopperPipes,
  getRoomsWater,
  getSelectIzbushkaId,
} from "../_shared/utils/supabase/rooms.ts";
import {
  checkPassportByRoomId,
  setPassport,
} from "../_shared/utils/supabase/passport.ts";
import { PassportUser, RoomNode } from "../_shared/utils/types/index.ts";
import { SUPABASE_URL } from "../_shared/utils/supabase/index.ts";

export type CreateUserT = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_bot: boolean;
  language_code: string;
  chat_id: number;
  inviter: string;
  invitation_codes?: string;
  telegram_id: number;
  select_izbushka: string;
};

const startIzbushka = async (ctx: Context) => {
  await ctx.reply(
    `🏰 Избушка повернулась к тебе передом, а к лесу задом. Нажми кнопку "Izbushka", чтобы начать встречу.`,
  );
  return;
};

const welcomeMenu = async (ctx: Context) => {
  await ctx.reply(
    `🏰 Избушка повернулась к тебе передом, а к лесу задом. Налево пойдешь - огнем согреешься, прямо пойдешь - в водичке омолодишься, а направо пойдешь - в медную трубу попадешь.`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔥 Огонь",
              callback_data: "fire",
            },
            {
              text: "💧 Вода",
              callback_data: "water",
            },
            {
              text: "🎺 Медные трубы",
              callback_data: "copper_pipes",
            },
          ],
        ],
      },
    },
  );
  return;
};

const welcomeMessage = async (ctx: Context) => {
  await ctx.reply(
    `🏰 Добро пожаловать в Тридевятое Царство, ${ctx?.update?.message?.from?.first_name}! \nВсемогущая Баба Яга, владычица тайн и чародейница, пред врата неведомого мира тебя привечает.\nЧтоб изба к тебе передком обернулась, а не задом стояла, не забудь прошептать кабы словечко-проходное.`,
    {
      reply_markup: {
        force_reply: true,
      },
    },
  );
  return;
};

const intro = ({ language_code = "en" }: { language_code?: string }) => {
  const intro = language_code === "ru"
    ? `🏰 Избушка повернулась к тебе передом, а к лесу задом. На лево пойдешь огонем согреешься, прямо пойдешь в водичке омолодишься, а на право пойдешь в медную трубу попадешь.`
    : `🏰 The hut turned its front to you, and its back to the forest. If you go to the left you will be warmed by the fire, you will go straight ahead in the water and you will rejuvenate, and to the right you will go into a copper pipe.
`;
  return intro;
};

// Обработчик команды "start"
botAiKoshey.command("start", async (ctx: Context) => {
  console.log("start"); // Вывод в консоль сообщения "start"
  await ctx.replyWithChatAction("typing"); // Отправка действия набора сообщения в чате

  // Получение параметров из текста сообщения
  const params = ctx?.message?.text && ctx?.message?.text.split(" ")[1];
  console.log(params, "params");
  const message = ctx.update.message;
  const username = message?.from?.username;

  if (params) {
    const underscoreIndex = params.indexOf("_"); // Находим индекс первого символа '_'
    if (underscoreIndex !== -1) {
      const select_izbushka = params.substring(0, underscoreIndex); // Извлекаем часть до '_'
      const inviter = params.substring(underscoreIndex + 1); // Извлекаем всё после '_'

      console.log(select_izbushka, "select_izbushka"); // Выводит "100"
      console.log(inviter, "inviter"); // Выводит "ai_koshey_more"

      // Проверка наличия выбранной избушки и пригласившего пользователя
      if (select_izbushka && inviter) {
        try {
          // Проверка существования пригласившего пользователя
          const { isInviterExist, inviter_user_id, invitation_codes } =
            await checkUsernameCodes(inviter);

          if (isInviterExist && invitation_codes) {
            console.log(isInviterExist, "isInviterExist");

            const first_name = message?.from?.first_name;
            const last_name = message?.from?.last_name;

            if (username) {
              // Проверка существования пользователя и создание его, если его нет

              const { isUserExist } = await checkAndReturnUser(
                username,
              );
              console.log(isUserExist, "isUserExist"); // Вывод информации о пользователе

              if (!isUserExist) {
                console.log("!isUserExist");
                console.log(
                  first_name,
                  last_name,
                  username,
                  message?.from?.id,
                  message?.from?.is_bot,
                  message?.from?.language_code,
                  message?.chat?.id,
                );
                if (
                  first_name && last_name && username &&
                  message?.from?.id &&
                  message?.from?.language_code && message?.chat?.id
                ) {
                  const userObj: CreateUserT = {
                    id: message?.from?.id,
                    username,
                    first_name,
                    last_name,
                    is_bot: message?.from?.is_bot,
                    language_code: message?.from?.language_code,
                    chat_id: message?.chat?.id,
                    inviter: inviter_user_id,
                    invitation_codes,
                    telegram_id: message?.from?.id,
                    select_izbushka,
                  };
                  console.log(userObj, "userObj");
                  const newUser = await createUser(userObj);
                  console.log(newUser, "newUser");

                  await welcomeMenu(ctx);
                  return;
                }
              } else {
                const { isUserExist, user } = await checkAndReturnUser(
                  username,
                );
                if (isUserExist) {
                  console.log(select_izbushka, "select_izbushka");
                  const { izbushka } = await getSelectIzbushkaId(
                    select_izbushka,
                  );
                  console.log(izbushka, "izbushka");
                  if (
                    izbushka && user && first_name && last_name &&
                    user.telegram_id && izbushka.workspace_id
                  ) {
                    const passport_user: PassportUser = {
                      user_id: user.user_id,
                      workspace_id: izbushka.workspace_id,
                      room_id: izbushka.room_id,
                      username,
                      first_name,
                      last_name,
                      chat_id: user.telegram_id,
                      type: "room",
                      is_owner: false,
                      photo_url: user.photo_url || null,
                    };
                    console.log(passport_user, "passport_user");

                    // проверить есть ли у юзера паспорт к этой избушке и не выдовать если есть
                    console.log(user.user_id, "user.user_id");
                    console.log(izbushka.room_id, "izbushka.room_id");
                    const isPassportExist = await checkPassportByRoomId(
                      user.user_id,
                      izbushka.room_id,
                      "room",
                    );
                    console.log(isPassportExist, "isPassportExist");
                    if (!isPassportExist) {
                      await setPassport(passport_user);
                    }

                    if (select_izbushka && username) {
                      await setSelectedIzbushka(
                        username,
                        select_izbushka,
                      );
                    }
                    await startIzbushka(ctx);
                  } else {
                    await ctx.reply(
                      `🤔 Error: getSelectIzbushkaId.\n${izbushka}`,
                    );
                    throw new Error("Error: getSelectIzbushkaId.");
                  }
                  return;
                }
              }
            }
          }
        } catch (error) {
          await ctx.reply(
            `🤔 Что-то пошло не так, попробуйте ещё раз.\n${error}`,
          );
          return;
        }
      } else {
        if (username) {
          // Проверка существования пользователя и отправка соответствующего сообщения
          const { isUserExist } = await checkAndReturnUser(username);
          console.log(isUserExist, "else isUserExist");
          if (isUserExist) {
            await welcomeMenu(ctx); // Отправка сообщения меню приветствия
          } else {
            await welcomeMessage(ctx); // Отправка приветственного сообщения
          }
          return;
        }
      }
    }
  } else {
    if (username) {
      try {
        const { isUserExist } = await checkAndReturnUser(
          username,
        );

        if (isUserExist) {
          console.log("isUserExist");
          await welcomeMenu(ctx);
        } else {
          console.log("NotUserExist");
          await welcomeMessage(ctx);
        }
        return;
      } catch (error) {
        await ctx.reply(`🤔 Error: checkAndReturnUser.\n${error}`);
        throw new Error("Error: checkAndReturnUser.");
      }
    }
  }
});

botAiKoshey.on("message:text", async (ctx: Context) => {
  await ctx.replyWithChatAction("typing");
  const inviter = ctx?.message?.text;

  // Проверяем, является ли сообщение ответом (есть ли reply_to_message)
  if (ctx?.message?.reply_to_message) {
    // Проверяем, содержит ли текст оригинального сообщения определенный текст
    const originalMessageText = ctx?.message?.reply_to_message?.text;
    console.log(originalMessageText, "originalMessageText");
    if (
      originalMessageText &&
      (originalMessageText.includes("🏰 Добро пожаловать") ||
        originalMessageText.includes("🔒 Ох, увы и ах!"))
    ) {
      try {
        const { isInviterExist, inviter_user_id } = await checkUsernameCodes(
          inviter as string,
        );

        if (isInviterExist) {
          const message = ctx.update.message;
          const language_code = message?.from?.language_code;
          const user = {
            id: message?.from?.id,
            username: message?.from?.username,
            first_name: message?.from?.first_name,
            last_name: message?.from?.last_name,
            is_bot: message?.from?.is_bot,
            language_code,
            chat_id: message?.chat?.id,
            inviter: inviter_user_id,
            invitation_codes: "",
            telegram_id: message?.from?.id,
          };
          const newUser = await createUser(user);
          await ctx.replyWithChatAction("typing");
          newUser && await ctx.reply(
            intro({ language_code }),
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🔥 Огонь",
                      callback_data: "fire",
                    },
                    {
                      text: "🎺 Медные трубы",
                      callback_data: "copper_pipes",
                    },
                    {
                      text: "💧 Вода",
                      callback_data: "water",
                    },
                  ],
                ],
              },
            },
          );
          return;
        } else {
          await ctx.reply(
            `🔒 Ох, увы и ах! Словечко, что до меня дошло, чарам тайным не отвечает. Прошу, дай знать иное, что ключом является верным, чтоб путь твой в царство дивное открыть сумели без замедления.`,
            {
              reply_markup: {
                force_reply: true,
              },
            },
          );
          return;
        }
      } catch (error) {
        console.error(error);
      }
      // Обрабатываем ответ пользовател
    } else {
      // const query = ctx?.message?.text;
      // console.log(query, "query");
      // try {
      //   if (query && aiKosheyUrl) {
      //     const endpoint =
      //       `${SUPABASE_URL}/functions/v1/ask-data?secret=${FUNCTION_SECRET}`;

      //     const { content } = await getAiFeedbackFromSupabase({
      //       query,
      //       endpoint: endpoint,
      //     });
      //     console.log(content, "content");
      //     await ctx.reply(content, { parse_mode: "Markdown" });
      //     return;
      //   }
      // } catch (error) {
      //   console.error("Ошибка при получении ответа AI:", error);
      //   return;
      // }
      return;
    }
  } else {
    await ctx.replyWithChatAction("typing");
    const query = ctx?.message?.text;
    console.log(query, "query");
    try {
      if (query && aiKosheyUrl) {
        try {
          if (query && aiKosheyUrl) {
            const endpoint =
              `${SUPABASE_URL}/functions/v1/ask-data?secret=${FUNCTION_SECRET}`;

            const { content } = await getAiFeedbackFromSupabase({
              query,
              endpoint: endpoint,
            });
            console.log(content, "content");
            await ctx.reply(content, { parse_mode: "Markdown" });
            return;
          }
        } catch (error) {
          console.error("Ошибка при получении ответа AI:", error);
          return;
        }
      }
    } catch (error) {
      console.error("Ошибка при получении ответа AI:", error);
      return;
    }
    return;
  }
});

botAiKoshey.on("callback_query:data", async (ctx) => {
  console.log(ctx.callbackQuery, "callback_query");
  await ctx.replyWithChatAction("typing");

  const callbackData = ctx.callbackQuery.data;

  const username = ctx.update && ctx.update.callback_query.from.username;

  const handleRoomSelection = async (
    ctx: Context,
    rooms: RoomNode[],
    type: string,
  ) => {
    console.log(callbackData, "callbackData");
    try {
      if (rooms && rooms.length > 0) {
        console.log(rooms, " handleRoomSelection rooms");
        const keyboard = rooms
          .filter((room: RoomNode) => room)
          .map((room: RoomNode) => ({
            text: room.name,
            callback_data: `select_izbushka_${room.id}`,
          }))
          .reduce(
            (
              acc: { text: string; callback_data: string }[][],
              curr: { text: string; callback_data: string },
              index: number,
            ) => {
              const row = Math.floor(index / 1);
              acc[row] = acc[row] || [];
              acc[row].push(curr);
              return acc;
            },
            [],
          );
        console.log(keyboard, "keyboard");
        await ctx.replyWithChatAction("typing");
        if (type === "fire") {
          await ctx.reply(
            "🔥 Пламя горячее - это личные избушки, где твои слова пишутся и задачи создаются.",
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
          return;
        } else if (type === "water") {
          await ctx.reply(
            "💧 Воды чистые к себе манят, где гость ты в избушках дорогой.\n\nЗдесь избушки, к которым у тебя есть доступ.",
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
          return;
        } else if (type === "copper_pipes") {
          await ctx.reply(
            "🎺 Медные трубы - это чародейские избушки, где обучение к мудрости тебя ведет.",
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
          return;
        }
        return;
      } else {
        await ctx.reply(`У вас нет избушек куда вас пригласили`);
        return;
      }
    } catch (error) {
      await ctx.reply(`Ошибка при выборе избушки`, error);
      throw new Error("Ошибка при выборе избушки");
    }
  };

  if (callbackData === "fire") {
    const rooms = username && (await getRooms(username));
    console.log(rooms, "rooms fire");
    rooms && await handleRoomSelection(ctx, rooms, "fire");
  } else if (callbackData === "water") {
    const rooms = username && (await getRoomsWater(username));
    console.log(rooms, "rooms waters");
    rooms && await handleRoomSelection(ctx, rooms, "water");
  } else if (callbackData === "copper_pipes") {
    const rooms = await getRoomsCopperPipes();
    console.log(rooms, "rooms copper_pipes");
    rooms && await handleRoomSelection(ctx, rooms, "copper_pipes");
  }

  if (callbackData === "name_izbushka") {
    try {
      await ctx.reply("Как назовем избушку?", {
        reply_markup: {
          force_reply: true,
        },
      });
      return;
    } catch (error) {
      console.error(error);
    }
  }

  if (callbackData === "show_izbushka") {
    const rooms = username && (await getRooms(username));
    // console.log(rooms, "rooms");
    try {
      if (Array.isArray(rooms)) {
        await ctx.reply("🏡 Выберите избушку", {
          reply_markup: {
            inline_keyboard: rooms
              .filter((room: RoomNode) => room)
              .map((room: RoomNode) => ({
                text: room.name,
                callback_data: `select_izbushka_${room.id}`,
              }))
              .reduce(
                (
                  acc: { text: string; callback_data: string }[][],
                  curr,
                  index,
                ) => {
                  const row = Math.floor(index / 1);
                  acc[row] = acc[row] || [];
                  acc[row].push(curr);
                  return acc;
                },
                [],
              ),
          },
        });
      } else {
        await ctx.reply("Ошибка: не удалось загрузить избушки.");
      }
      return;
    } catch (error) {
      console.error("error show_izbushka", error);
      return;
    }
  }

  if (callbackData.includes("select_izbushka")) {
    const select_izbushka = callbackData.split("_")[2];
    console.log(select_izbushka, "select_izbushka");
    if (select_izbushka) {
      username && await setSelectedIzbushka(username, select_izbushka);
    }

    await ctx.reply(
      `📺 Что ж, путник дорогой, дабы трансляцию начать, нажми кнопку "Izbushka" смелее и веселись, ибо все приготовлено к началу твоего путешествия по цифровым просторам!\n\n🌟 Поделись следующей ссылкой с тем, с кем встретиться в Избушке на курьих ножках хочешь.`,
    );
    await delay(500);
    await ctx.reply(
      `🏰 Приглашение в Тридевятое Царство 🏰\n\nНажми на ссылку чтобы присоединиться!\n\nhttps://t.me/${botUsername}?start=${select_izbushka}_${username}\n\nПосле подключения к боту нажми на кнопку "Izbushka", чтобы войти на видео встречу.`,
    );
    return;
  }
});

// botAiKoshey.on("message:text", async (ctx) => {
//   await ctx.replyWithChatAction("typing");
//   const query = ctx?.message?.text;
//   console.log(query, "query");
//   try {
//     if (query && aiKosheyUrl) {
//       const endpoint =
//         `${SUPABASE_URL}/functions/v1/ask-data?secret=${FUNCTION_SECRET}`;
//       console.log(endpoint, "endpoint");
//       const feedback = await getAiFeedbackFromSupabase({
//         query,
//         endpoint: endpoint,
//       });
//       await ctx.reply(feedback, { parse_mode: "Markdown" });
//       return;
//     }
//   } catch (error) {
//     console.error("Ошибка при получении ответа AI:", error);
//     return;
//   }
//   return;
// });

await botAiKoshey.api.setMyCommands([
  {
    command: "/start",
    description: "Start chatting with Ai Koshey",
  },
  // {
  //   command: "/room",
  //   description: "Create a room",
  // },
]);

botAiKoshey.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      return new Response("not allowed", { status: 405 });
    }

    return await handleUpdateAiKoshey(req);
  } catch (err) {
    console.error(err);
  }
});

// supabase functions deploy ai-koshey --no-verify-jwt
