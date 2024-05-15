console.log(`Function "ai_kochey_bot" up and running!`);

import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  webhookCallback,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";

import {
  checkUsernameCodes,
  getRooms,
  getSupabaseUser,
  setMyWorkspace,
  setSelectedIzbushka,
  supabase,
} from "../_shared/utils/supabase/index.ts";
import { transliterate } from "../_shared/utils/openai/transliterate.ts";
import { create100MsRoom } from "../_shared/utils/100ms/create-room.ts";
import { getAiFeedback } from "../get-ai-feedback.ts";
import { DEV } from "../_shared/utils/constants.ts";

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
  const select_izbushka = ctx?.message?.text && ctx.message.text.split(" ")[1];

  if (select_izbushka) {
    const username = ctx?.update?.message?.from?.username;

    username && await setSelectedIzbushka(username, select_izbushka);

    ctx.reply(
      `📺 Что ж, путник дорогой, дабы трансляцию начать, нажми кнопку "Избушка" смелее и веселись, ибо все приготовлено к началу твоего путешествия по цифровым просторам!`,
    );
    return;
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

botAiKoshey.on("message:text", async (ctx) => {
  console.log(ctx.message, "message");
  await ctx.replyWithChatAction("typing");
  const username = ctx.message.from.username;
  const inviter = ctx.message.text;
  // console.log(replyText, "replyText");

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username);
  if (error) {
    console.error(error, "message:text -> users");
  }
  // console.log(data, "data");
  // console.log(error, "error");
  const user_id = data && data[0]?.user_id;
  // Проверяем, является ли сообщение ответом (есть ли reply_to_message)
  if (ctx.message.reply_to_message) {
    // Проверяем, содержит ли текст оригинального сообщения определенный текст
    const originalMessageText = ctx.message.reply_to_message.text;
    console.log(originalMessageText, "originalMessageText");
    if (
      originalMessageText &&
      (originalMessageText.includes("🏰 Добро пожаловать") ||
        originalMessageText.includes("🔒 Ох, увы и ах!"))
    ) {
      // Обрабатываем ответ пользователя

      // Действия с ответом пользователя, например, сохранение токена

      const { isInviterExist, invitation_codes, inviter_user_id } =
        await checkUsernameCodes(inviter as string);
      console.log(isInviterExist, "isInviterExist");
      try {
        if (isInviterExist) {
          const newUser = {
            first_name: ctx.message.from.first_name,
            last_name: ctx.message.from.last_name,
            username: ctx.message.from.username,
            language_code: ctx.message.from.language_code,
            telegram_id: ctx.message.from.id,
            inviter: inviter_user_id,
            invitation_codes,
          };
          console.log(newUser, "newUser");

          const { error: userDataError } = await supabase
            .from("users").insert([{ ...newUser }]);

          if (userDataError) {
            console.error(userDataError, "message:text -> users");
          }
          // const isPayment = true;

          const user_id = ctx.message.from.username;

          const userData = user_id && await getSupabaseUser(user_id);

          await setMyWorkspace(userData.user_id);

          ctx.reply(
            `🏰 Благоволи войти в волшебные пределы Тридевятого Царства, где сказание оживает, а чудеса само собой рядом ступают. ${ctx.update.message?.from.first_name}!`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🛰 Построить избушку",
                      callback_data: "name_izbushka",
                    },
                    {
                      text: "🏡 Узреть избушки",
                      callback_data: "show_izbushka",
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
        ctx.reply(`Что-то пошло не так, попробуйте ещё раз.`);
        console.error(error, "message:text");
        return;
      }
    }
    //   TODO For water level
    if (originalMessageText?.includes("Как назовем избушку?")) {
      try {
        // const { error: createRoomError } = await supabase.from("rooms").insert({
        //   name: replyText,
        //   user_id,
        //   username,
        //   original_name: replyText,
        // });
        // console.log(createRoomError, "createRoomError");

        // TODO For water level
        // ctx.reply(
        //   "🗝️ Для того чтобы связать вашего цифрового двойника с личным нейросетевым ассистентом, пожалуйста, введите специальный токен, выданный BotFather.",
        //   {
        //     reply_markup: {
        //       force_reply: true,
        //     },
        //   },
        // );
        return;
      } catch (error) {
        console.error(error);
        return;
      }
    }

    if (
      originalMessageText?.includes(
        "🗝️ Для того чтобы связать вашего цифрового двойника с личным нейросетевым ассистентом, пожалуйста, введите специальный токен, выданный BotFather.",
      )
    ) {
      const userToken = ctx.update.message.text;

      const { data: dataRooms, error: errorRooms } = await supabase
        .from("rooms")
        .select("*")
        .eq("user_id", user_id)
        .order("id", { ascending: false });

      const lastElement = dataRooms && dataRooms[0];

      const translateName = transliterate(lastElement?.name);

      const newData = {
        id: lastElement?.id,
        name: translateName,
        original_name: lastElement?.name,
        type: "meets",
        username: ctx.message.from.username,
        user_id,
        token: userToken,
        chat_id: ctx.message.chat.id,
        lang: ctx.message.from.language_code,
      };
      console.log(newData, "newData");

      try {
        await create100MsRoom(newData);
        ctx.reply(
          `✨ Построена избушка, дабы отныне могли вы словесный обмен творить и земляков своих ближайших призывать, отправь им словечко проходное.`,
        );
        ctx.reply(
          `🌌 Ключ ко вратам Тридевятого Царства, где мечты твои обретут образ, и магия плетётся по воле твоей. Сие словечко проходное отворит двери избушки на курьих ножках, ведущей тебя к тайнам безграничным и чудесам незримым.\n\n🗝️ Словечко: ${ctx.message.from.username}\n🏰 Вход в Тридевятое Царство: @dao999nft_dev_bot`,
        );
        ctx.reply(
          `🏡 Нажми на кнопку и запусти чудодейственные механизмы сети мировой, ты сможешь мгновенно окинуть взором свои владения, не отходя от домашнего очага.
        `,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🏡 Узреть избушки",
                    callback_data: "show_izbushka",
                  },
                ],
              ],
            },
          },
        );
        return;
      } catch (error) {
        ctx.reply(`Что-то пошло не так, попробуйте ещё раз.`);
        return;
      }
    }
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
});

botAiKoshey.on("callback_query:data", async (ctx) => {
  console.log(ctx.callbackQuery, "callback_query");
  await ctx.replyWithChatAction("typing");

  const callbackData = ctx.callbackQuery.data;

  const username = ctx.update && ctx.update.callback_query.from.username;

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
              .filter((room: any) => room)
              .map((room: any) => ({
                text: room.name,
                callback_data: `select_izbushka_${room.id}`,
              }))
              .reduce((acc: any, curr: any, index: number) => {
                const row = Math.floor(index / 1); // Устанавливаем количество кнопок в одном ряду (здесь 2 кнопки в ряду)
                acc[row] = acc[row] || [];
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
    } else {
      ctx.reply(`🤔 Что-то пошло не так, попробуйте ещё раз.`);
    }

    ctx.reply(
      `📺 Что ж, путник дорогой, дабы трансляцию начать, нажми кнопку "Izbushka" смелее и веселись, ибо все приготовлено к началу твоего путешествия по цифровым просторам!\n🌟 Также поделись этой ссылкою с другом своим, чтобы присоединится он к избушке твоей и не забудь сказать ему ты словечко проходное в Царство Тридевятое, коим является твой телеграм юзернейм.
      `,
    );

    ctx.reply(
      `Приглашение в избушку. Нажми на кнопку чтобы присоединиться!\n\nhttps://t.me/ai_koshey_bot?start=${select_izbushka}`,
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
