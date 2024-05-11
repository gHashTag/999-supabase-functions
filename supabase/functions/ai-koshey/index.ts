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
  checkUsernameCodes,
  getRooms,
  getRoomsCopperPipes,
  getRoomsWater,
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
};

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

botAiKoshey.command("start", async (ctx: Context) => {
  console.log("start");
  await ctx.replyWithChatAction("typing");
  const params = ctx?.message?.text && ctx?.message?.text.split("_");
  console.log(params, "params");
  const inviter = params && params[0].split(" ")[1];
  console.log(inviter, "inviter");
  const select_izbushka = params && params[1];
  console.log(select_izbushka, "select_izbushka");

  if (select_izbushka && inviter) {
    const { isInviterExist, inviter_user_id, invitation_codes } =
      await checkUsernameCodes(
        inviter,
      );
    if (isInviterExist) {
      const message = ctx.update.message;
      const username = message?.from?.username;
      const userObj = {
        id: message?.from?.id,
        username,
        first_name: message?.from?.first_name,
        last_name: message?.from?.last_name,
        is_bot: message?.from?.is_bot,
        language_code: message?.from?.language_code,
        chat_id: message?.chat?.id,
        inviter: inviter_user_id,
        invitation_codes,
        telegram_id: message?.from?.id,
        select_izbushka,
      };
      try {
        if (username) {
          const { isUserExist } = await checkAndReturnUser(username);
          if (!isUserExist) {
            const newUser = await createUser(userObj);
            console.log(newUser, "newUser");
          }
          await setSelectedIzbushka(username, select_izbushka);
          ctx.reply(
            `🏰 Избушка повернулась к тебе передом, а к лесу задом. Нажми на кнопку "Избушка" или выбирай куда пойдешь ты по Царству Тридевятому.\nНа лево пойдешь огонем согреешься, на право в водичке омолодишься, а прямо пойдешь в медную трубу попадешь.\n🔥 Пламя горячее - это твоя личная избушка, где твои желания сбываются.\n💧 Воды чистые к себе манят, где ты гость в избушках дорогой.\n🎺 Медные трубы - это чародейская избушка, где обучение к мудрости тебя ведет.
          `,
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
        }
      } catch (error) {
        ctx.reply(`🤔 Что-то пошло не так, попробуйте ещё раз.\n${error}`);
      }
      return;
    }
  } else {
    ctx.reply(
      `🏰 Добро пожаловать в Тридевятое Царство, ${ctx?.update?.message?.from?.first_name}! \nВсемогущая Баба Яга, владычица тайн и чародейница, пред врата неведомого мира тебя привечает.\nЧтоб изба к тебе передком обернулась, а не задом стояла, не забудь прошептать кабы словечко-проходное.`,
      {
        reply_markup: {
          force_reply: true,
        },
      },
    );
    return;
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
          const user = {
            id: message?.from?.id,
            username: message?.from?.username,
            first_name: message?.from?.first_name,
            last_name: message?.from?.last_name,
            is_bot: message?.from?.is_bot,
            language_code: message?.from?.language_code,
            chat_id: message?.chat?.id,
            inviter: inviter_user_id,
            invitation_codes: "",
            telegram_id: message?.from?.id,
          };
          const newUser = await createUser(user);

          newUser && ctx.reply(
            `🏰 Избушка повернулась к тебе передом, а к лесу задом. Выбирай куда пойдешь ты по Царству Тридевятому. На лево пойдешь огонем согреешься, на право в водичке омолодишься, а прямо пойдешь в медную трубу попадешь.\n🔥 Пламя горячее - это твоя личная избушка, где твои желания сбываются.\n💧 Воды чистые к себе манят, где ты гость в избушках дорогой.\n🎺 Медные трубы - это чародейская избушка, где обучение к мудрости тебя ведет.
          `,
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
    errorMessage: any,
  ) => {
    try {
      if (rooms) {
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

        ctx.reply("🏡 Выберите свою избушку", {
          reply_markup: { inline_keyboard: keyboard },
        });
      } else {
        ctx.reply(errorMessage);
      }
    } catch (error) {
      console.error(error);
      ctx.reply(errorMessage, error);
    }
  };

  if (callbackData === "fire") {
    const rooms = username && (await getRooms(username));
    await handleRoomSelection(ctx, rooms, "🔥 Огонь");
  } else if (callbackData === "water") {
    const rooms = username && (await getRoomsWater(username));
    await handleRoomSelection(ctx, rooms, "💧 Вода");
  } else if (callbackData === "copper_pipes") {
    const rooms = await getRoomsCopperPipes();
    await handleRoomSelection(ctx, rooms, "🎺 Медные трубы");
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

    ctx.reply(
      `📺 Что ж, путник дорогой, дабы трансляцию начать, нажми кнопку "Izbushka" смелее и веселись, ибо все приготовлено к началу твоего путешествия по цифровым просторам!\n🌟 Также поделись этой ссылкою с другом своим, чтобы присоединится он к избушке твоей и не забудь сказать ему ты словечко проходное в Царство Тридевятое, коим является твой телеграм юзернейм.
      `,
    );
    const botUsername = DEV ? "dao999nft_dev_bot" : "ai_koshey_bot";
    ctx.reply(
      `Приглашение в избушку. Нажми на кнопку чтобы присоединиться!\n\nhttps://t.me/${botUsername}?start=${username}_${select_izbushka}`,
    );
    return;
  }
});

await botAiKoshey.api.setMyCommands([
  {
    command: "/start",
    description: "Start the bot",
  },
  // {
  //   command: "/room",
  //   description: "Create a room",
  // },
]);

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
