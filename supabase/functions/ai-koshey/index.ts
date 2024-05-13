console.log(`Function "ai_kochey_bot" up and running!`);

import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  webhookCallback,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";

import {
  checkAndReturnUser,
  checkPassportByRoomId,
  checkUsernameCodes,
  createPassport,
  getRooms,
  getRoomsCopperPipes,
  getRoomsWater,
  getSelectIzbushkaId,
  setPassport,
  setSelectedIzbushka,
} from "../_shared/utils/supabase.ts";

import { getAiFeedback } from "../get-ai-feedback.ts";
import { DEV } from "../_shared/utils/constants.ts";
import { createUser } from "../_shared/utils/nextapi/index.ts";

if (!Deno.env.get("TELEGRAM_BOT_TOKEN_AI_KOSHEY")) {
  throw new Error("TELEGRAM_BOT_TOKEN_AI_KOSHEY is not set");
}

if (!Deno.env.get("TELEGRAM_BOT_TOKEN_AI_KOSHEY_TEST")) {
  throw new Error("TELEGRAM_BOT_TOKEN_AI_KOSHEY_TEST is not set");
}

if (!Deno.env.get("AI_KOSHEY_URL")) {
  throw new Error("AI_KOSHEY_URL is not set");
}

if (!Deno.env.get("AI_KOSHEY_FLOWISE_TOKEN")) {
  throw new Error("AI_KOSHEY_FLOWISE_TOKEN is not set");
}

const aiKosheyUrl = Deno.env.get("AI_KOSHEY_URL");
const aiKosheyFlowiseToken = Deno.env.get("AI_KOSHEY_FLOWISE_TOKEN");

const tokenProd = Deno.env.get("TELEGRAM_BOT_TOKEN_AI_KOSHEY");
const tokenTest = Deno.env.get("TELEGRAM_BOT_TOKEN_AI_KOSHEY_TEST");

const token = DEV ? tokenTest : tokenProd;

const botAiKoshey = new Bot(token || "");

export type CreateUserT = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_bot: boolean;
  language_code: string;
  chat_id: number;
  inviter: string;
  invitation_codes: string;
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
  console.log(params, "params"); // Вывод параметров в консоль
  if (params) {
    const underscoreIndex = params.indexOf("_"); // Находим индекс первого символа '_'
    if (underscoreIndex !== -1) {
      const select_izbushka = params.substring(0, underscoreIndex); // Извлекаем часть до '_'
      const inviter = params.substring(underscoreIndex + 1); // Извлекаем всё после '_'

      console.log(select_izbushka, "select_izbushka"); // Выводит "100"
      console.log(inviter, "inviter"); // Выводит "ai_koshey_more"

      const message = ctx.update.message;
      const username = message?.from?.username;

      // Проверка наличия выбранной избушки и пригласившего пользователя
      if (select_izbushka && inviter) {
        try {
          // Проверка существования пригласившего пользователя
          const { isInviterExist, inviter_user_id, invitation_codes } =
            await checkUsernameCodes(inviter);

          if (isInviterExist) {
            console.log(isInviterExist, "isInviterExist");

            const first_name = message?.from?.first_name;
            const last_name = message?.from?.last_name;

            if (username) {
              // Проверка существования пользователя и создание его, если его нет
              try {
                const { isUserExist, user } = await checkAndReturnUser(
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
                    try {
                      const { izbushka } = await getSelectIzbushkaId(
                        select_izbushka,
                      );
                      if (izbushka) {
                        const passport_user = {
                          user_id: user.user_id,
                          workspace_id: izbushka.workspace_id,
                          room_id: izbushka.room_id,
                          username,
                          first_name,
                          last_name,
                          chat_id: izbushka.chat_id,
                          type: "room",
                          is_owner: false,
                        };
                        console.log(passport_user, "passport_user");
                        try {
                          // проверить есть ли у юзера паспорт к этой избушке и не выдовать если есть
                          const isPassportExist = await checkPassportByRoomId(
                            user.user_id,
                            izbushka.room_id,
                          );
                          if (!isPassportExist) {
                            await setPassport(passport_user);
                          }
                          try {
                            await startIzbushka(ctx);
                          } catch (error) {
                            await ctx.reply(
                              `🤔 Error: startIzbushka.\n${error}`,
                            );
                            throw new Error("Error: setPassport.");
                          }
                        } catch (error) {
                          await ctx.reply(`🤔 Error: setPassport.\n${error}`);
                          throw new Error("Error: setPassport.");
                        }
                      } else {
                        ctx.reply(
                          `🤔 Error: getSelectIzbushkaId.\n${izbushka}`,
                        );
                        throw new Error("Error: getSelectIzbushkaId.");
                      }
                      return;
                    } catch (error) {
                      ctx.reply(`🤔Error: getSelectIzbushkaId.\n${error}`);
                      throw new Error("Error: getSelectIzbushkaId.");
                    }
                  }
                }
              } catch (error) {
                console.error(error, "error createNewPassport");
              }
            }
          }
        } catch (error) {
          ctx.reply(`🤔 Что-то пошло не так, попробуйте ещё раз.\n${error}`);
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

          newUser && ctx.reply(
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
          ctx.reply(
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
      const query = ctx?.message?.text;

      try {
        if (query && aiKosheyUrl && aiKosheyFlowiseToken) {
          const feedback = await getAiFeedback({
            query,
            endpoint: aiKosheyUrl,
            token: aiKosheyFlowiseToken,
          });
          await ctx.reply(feedback, { parse_mode: "Markdown" });
          return;
        }
      } catch (error) {
        console.error("Ошибка при получении ответа AI:", error);
        return;
      }
      return;
    }
  }
});

botAiKoshey.on("callback_query:data", async (ctx) => {
  console.log(ctx.callbackQuery, "callback_query");
  await ctx.replyWithChatAction("typing");

  const callbackData = ctx.callbackQuery.data;

  const username = ctx.update && ctx.update.callback_query.from.username;

  const handleRoomSelection = async (
    ctx: any,
    rooms: any,
    type: string,
  ) => {
    try {
      if (rooms && rooms.length > 0) {
        console.log(rooms, "rooms");
        const keyboard = rooms
          .filter((room: any) => room)
          .map((room: any) => ({
            text: room.name,
            callback_data: `select_izbushka_${room.id}`,
          }))
          .reduce((acc: any, curr: any, index: number) => {
            const row = Math.floor(index / 1);
            acc[row] = acc[row] || [];
            acc[row].push(curr);
            return acc;
          }, []);
        if (type === "fire") {
          await ctx.reply(
            "🔥 Пламя горячее - это личные избушки, где твои слова пишутся и задачи создаются.",
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
        } else if (type === "water") {
          await ctx.reply(
            "💧 Воды чистые к себе манят, где гость ты в избушках дорогой.\n\nЗдесь избушки, к которым у тебя есть доступ.",
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
        } else if (type === "copper_pipes") {
          await ctx.reply(
            "🎺 Медные трубы - это чародейские избушки, где обучение к мудрости тебя ведет.",
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
        }

        return;
      } else {
        await ctx.reply(`У вас нет избушек куда вас пригласили`);
        return;
      }
    } catch (error) {
      console.error(error);
      await ctx.reply(`Ошибка при выборе избушки`, error);
      return;
    }
  };

  if (callbackData === "fire") {
    const rooms = username && (await getRooms(username));
    await handleRoomSelection(ctx, rooms, "fire");
  } else if (callbackData === "water") {
    const rooms = username && (await getRoomsWater(username));
    console.log(rooms, "rooms");
    await handleRoomSelection(ctx, rooms, "water");
  } else if (callbackData === "copper_pipes") {
    const rooms = await getRoomsCopperPipes();
    await handleRoomSelection(ctx, rooms, "copper_pipes");
  }

  if (callbackData === "name_izbushka") {
    try {
      ctx.reply("Как назовем избушку?", {
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
      ctx.reply("🏡 Выберите избушку", {
        reply_markup: {
          inline_keyboard: rooms
            ? rooms
              .filter((room) => room)
              .map((room) => ({
                text: room.name,
                callback_data: `select_izbushka_${room.id}`,
              }))
              .reduce((acc, curr, index) => {
                const row = Math.floor(index / 1); // Set the number of buttons in one row (here there are 2 buttons in a row)
                acc[row] = acc[row] || [];
                //@ts-ignore hide
                acc[row].push(curr);
                return acc;
              }, [])
            : [],
        },
      });
      return;
    } catch (error) {
      console.error("error show_izbushka", error);
      return;
    }
  }
  if (callbackData.includes("select_izbushka")) {
    const select_izbushka = callbackData.split("_")[2];

    if (select_izbushka) {
      username && await setSelectedIzbushka(username, select_izbushka);
    }
    const botUsername = DEV ? "dao999nft_dev_bot" : "ai_koshey_bot";
    setTimeout(async () => {
      await ctx.reply(
        `🏰 Приглашение в Тридевятое Царство 🏰.\n\nНажми на ссылку чтобы присоединиться!\n\nhttps://t.me/${botUsername}?start=${select_izbushka}_${username}\n\nПосле подключения к боту нажми на кнопку "Izbushka", чтобы войти на видео встречу.`,
      );
      return;
    }, 500);

    await ctx.reply(
      `📺 Что ж, путник дорогой, дабы трансляцию начать, нажми кнопку "Izbushka" смелее и веселись, ибо все приготовлено к началу твоего путешествия по цифровым просторам!\n\n🌟 Поделись следующей ссылкой с тем, с кем встретиться в Избушке на курьих ножках хочешь.`,
    );
  }
});

// await botAiKoshey.api.setMyCommands([
//   {
//     command: "/start",
//     description: "Start the bot",
//   },
//   // {
//   //   command: "/room",
//   //   description: "Create a room",
//   // },
// ]);

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

const handleUpdate = webhookCallback(botAiKoshey, "std/http");

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      return new Response("not allowed", { status: 405 });
    }

    return await handleUpdate(req);
  } catch (err) {
    console.error(err);
  }
});
