// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import {
  Context,
  GrammyError,
  HttpError,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";

import { checkSubscription } from "../check-subscription.ts";
import { AI_KOSHEY, delay } from "../_shared/constants.ts";
import { createUser } from "../_shared/nextapi/index.ts";
import {
  AiKosheyContext,
  botAiKoshey,
  botUsername,
  bugCatcherRequest,
  handleUpdateAiKoshey,
} from "../_shared/telegram/bots.ts";
import {
  checkAndReturnUser,
  checkUsernameCodes,
  getLanguage,
  getUid,
  getUsernameByTelegramId,
  setLanguage,
  setSelectedIzbushka,
  updateUser,
} from "../_shared/supabase/users.ts";
import {
  getRooms,
  getRoomsCopperPipes,
  getRoomsWater,
  getSelectIzbushkaId,
} from "../_shared/supabase/rooms.ts";
import {
  checkPassportByRoomId,
  getPassportsTasksByUsername,
  setPassport,
} from "../_shared/supabase/passport.ts";
import { PassportUser, RoomNode } from "../_shared/types/index.ts";
import {
  createVoiceSyncLabs,
  getAiFeedbackFromSupabase,
} from "../_shared/supabase/ai.ts";
import { createVideo } from "../_shared/heygen/index.ts";
import {
  getBiggest,
  getCorrects,
  getLastCallback,
  getQuestion,
  updateProgress,
  updateResult,
  getTop10Users
} from "../_shared/supabase/progress.ts";
import { pathIncrement } from "../path-increment.ts";
import { sendPaymentInfo } from "../_shared/supabase/payments.ts";

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
const isRu = async (ctx: Context) => {
  if (!ctx.from) throw new Error("User not found");
  const language = await getLanguage(ctx.from?.id.toString());
  if (!language) return ctx.from.language_code === "ru"
  return language === "ru";
}

const videoUrl = (isRu: boolean) => isRu ? "https://t.me/dao999nft_storage/5" : "https://t.me/dao999nft_storage/6";

// Обработчик команды "avatar"
botAiKoshey.command("avatar", async (ctx) => {
  if (!ctx.from) throw new Error("User not found");
  await ctx.replyWithChatAction("typing");
  const lang = await isRu(ctx)
  await ctx.reply(
    `${lang ? "Пришли текст" : "Send text"}`,
    {
      reply_markup: {
        force_reply: true,
      },
    },
  );
  return;
});

const startIzbushka = async (ctx: Context) => {
  const lang = await isRu(ctx)
  try {
    if (!ctx.from) throw new Error("User not found");
    // const text = isRu
    //   ? `🏰 Избушка повернулась к тебе передом, а к лесу задом. Нажми кнопку "Izbushka", чтобы начать встречу.`
    //   : `🏰 The hut turned its front to you, and its back to the forest. Tap the "Izbushka" button to start the encounter.`;

    const buttons = [
      {
        text: `${lang ? "Войти в Избушку" : "Enter the room"}`,
        web_app: { url: "https://dao999nft.com/show-izbushka" },
      },
    ];

    const text = lang
      ? `🤝 Начать встречу с тем, кто пригласил вас`
      : `🤝 Start the meeting with the person who invited you`;

    await ctx.reply(
      text,
      {
        reply_markup: {
          inline_keyboard: [buttons],
        },
      },
    );
    return;
  } catch (error) {
    await ctx.reply(lang ? "Сылка недействительна" : "Invalid link")
    throw new Error("startIzbushka", error);
  }
};

const textError = async (ctx: Context) => {
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  return `🔒 ${
    lang
      ? "Ох, увы и ах! Словечко, что до меня дошло, чарам тайным не отвечает. Прошу, дай знать иное, что ключом является верным, чтоб путь твой в царство дивное открыть сумели без замедления.\n\nЛибо вы можете попробовать пройти наш курс по нейросетям, использовав команду /course, и заработать наш токен $IGLA."
      : "Oh, my apologies! The word that came to me, the secret does not answer. Please, tell me another word that is the key to the right path, so that the path of your life is a strange and open way to the kingdom.\n\nOr you can try to pass our course on the neural networks, using the command /course, and earn our token $IGLA."
  }`;
};

const welcomeMenu = async (ctx: Context) => {
  console.log("✅welcomeMenu");
  await ctx.replyWithChatAction("upload_video"); // Отправка действия загрузки видео в чате
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  const text = lang
    ? `🏰 Избушка повернулась к тебе передом, а к лесу задом. Налево пойдешь - огнем согреешься, прямо пойдешь - в водичке омолодишься, а направо пойдешь - в медную трубу попадешь.`
    : `🏰 The hut turned its front to you, and its back to the forest. If you go to the left you will be warmed by the fire, you will go straight ahead in the water and you will rejuvenate, and to the right you will go into a copper pipe.`;

  await ctx.replyWithVideo(videoUrl(lang), {
    caption: text,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `🔥 ${lang ? "Огонь" : "Fire"}`,
            callback_data: "fire",
          },
          {
            text: `💧 ${lang ? "Вода" : "Water"}`,
            callback_data: "water",
          },
          {
            text: `🎺 ${lang ? "Медные трубы" : "Copper pipes"}`,
            callback_data: "copper_pipes",
          },
        ],
      ],
    },
  });

  return;
};

const welcomeMessage = async (ctx: Context) => {
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  const text = lang
    ? `🏰 Добро пожаловать в Тридевятое Царство, ${ctx?.update?.message?.from?.first_name}! \nВсемогущая Баба Яга, владычица тайн и чародейница, пред врата неведомого мира тебя привечает.\nЧтоб изба к тебе передком обернулась, а не задом стояла, не забудь прошептать кабы словечко-проходное.`
    : `🏰 Welcome, ${ctx?.update?.message?.from?.first_name}! \nThe all-powerful Babya Yaga, the ruler of secrets and charms, is preparing to confront you with the gates of the unknown world.\nTo save you from the front and not the back, remember to speak the word-a-word.`;

  await ctx.replyWithVideo(videoUrl(lang), {
    caption: text,
    reply_markup: {
      force_reply: true,
    },
  });
  return;
};

const intro = async (ctx: Context) => {
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  const intro = lang
    ? `🏰 Избушка повернулась к тебе передом, а к лесу задом. На лево пойдешь огнем согреешься, прямо пойдешь в водичке омолодишься, а на право пойдешь в медную трубу попадешь.`
    : `🏰 The hut turned its front to you, and its back to the forest. If you go to the left you will be warmed by the fire, you will go straight ahead in the water and you will rejuvenate, and to the right you will go into a copper pipe.
`;
  return intro;
};

const menuButton = async (ctx: Context) => {
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  const menuButton = [
    [
      {
        text: `🔥 ${lang ? "Огонь" : "Fire"}`,
        callback_data: "fire",
      },
      {
        text: `💧 ${lang ? "Вода" : "Water"}`,
        callback_data: "water",
      },
      {
        text: `🎺 ${lang ? "Медные трубы" : "Copper pipes"}`,
        callback_data: "copper_pipes",
      },
 
    ],
  ];
  return menuButton;
};

botAiKoshey.command("course", async (ctx) => {
  console.log("course");
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
    try {
      const questionContext = {
        lesson_number: 1,
        subtopic: 1,
      };

      const questions = await getQuestion({
        ctx: questionContext,
        language: "automation",
      });
      if (questions.length > 0) {
        const {
          topic: ruTopic,
          image_lesson_url,
          topic_en: enTopic,
        } = questions[0];

        const user_id = await getUid(ctx.from?.username || "");
        if (!user_id) {
          ctx.reply(lang ? "Вы не зарегестрированы." : "You are not registered.");
          return;
        }
        const topic = lang ? ruTopic : enTopic;
        const allAnswers = await getCorrects({
          user_id: user_id.toString(),
          language: "all",
        });
        // Формируем сообщение
        const messageText =
          `${topic}\n\n<i><u>${lang ? "Теперь мы предлагаем вам закрепить полученные знания." : "Now we are offering you to reinforce the acquired knowledge."}</u></i>\n\n<b>${lang ? "Total: " : "Total: "}${allAnswers} $IGLA</b>`;

        // Формируем кнопки
        const inlineKeyboard = [
          [{
            text: lang ? "Перейти к вопросу" : "Go to the question",
            callback_data: `automation_01_01`,
          }],
        ];

        if (image_lesson_url) {
          // Отправляем сообщение
          await ctx.replyWithPhoto(image_lesson_url || "", {
            caption: messageText,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: inlineKeyboard },
          });
          return;
        } else {
          await ctx.reply(messageText, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: inlineKeyboard },
          });
          return;
        }
      } else {
        await ctx.reply(lang ? "Вопросы не найдены." : "No questions found.");
      }
    } catch (error) {
      console.error(error);
    }
});

botAiKoshey.command("post", async (ctx) => {
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  const chatId = "-1002228291515";
  const message =
    `<b>Ай Кощей 🤖 Персональный нейронный ассистент</b>\n\nРешение для управления встречами и задачами в <b>Telegram</b>,  использует возможности искусственного интеллекта и блокчейн-технологий <b>TON (The Open Network)</b> для создания эффективной и прозрачной системы взаимодействия пользователей. \n\nЭто функция <b>"Бортовой журнал"</b> — первый шаг в создании персонального цифрового аватара. \n\nНаше видение заключается в создании умного помощника, который не только записывает и анализирует встречи, но и активно помогает в управлении задачами, делегировании и планировании не выходя из телеграм.`;
  const message_two =
    `🌟 Добро пожаловать в мир наших удивительных ботов по обучению искусственному интеллекту, <b>JavaScript, TypeScript, React, Python и Tact! 🤖💡</b>\n\n🔍 Наши боты предлагают уникальную возможность заработать наш токен знаний $IGLA, погружаясь в мир новых технологий и углубляясь в востребованные навыки. 🚀\n\n💼 В отличие от других кликеров, наши боты позволяют пользователям проводить время с пользой, обучаясь навыкам, которые значительно повысят вашу профессиональную ценность на рынке труда.\n\n📚 Не упустите шанс улучшить свои знания и навыки, становясь более востребованным специалистом в сфере IT!\n\nПрисоединяйтесь к нам и начните свое преображение <b>прямо сейчас</b>!`;
  const telegram_id = ctx.from?.id;
  if (!telegram_id) throw new Error("No telegram id");
  const chatMember = await botAiKoshey.api.getChatMember(chatId, telegram_id);
  const isAdmin = chatMember.status === "administrator" ||
    chatMember.status === "creator";
  if (!isAdmin) {
    await ctx.reply(
      lang
        ? "У вас нет прав администратора для выполнения этого действия."
        : "You do not have admin rights to perform this action.",
    );
    return;
  }

  try {
    await botAiKoshey.api.sendVideo(chatId, videoUrl(lang), {
      caption: message,
      parse_mode: "HTML",
    });
    await botAiKoshey.api.sendMessage(chatId, message_two, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          // { text: "Automatization", url: "https://t.me/bot1" },
          { text: "TypeScript", url: "https://t.me/typescript_dev_bot" },
          { text: "Python", url: "https://t.me/python_ai_dev_bot" },
        ], [{ text: "React", url: "https://t.me/react_native_dev_bot" }, {
          text: "JavaScript",
          url: "https://t.me/javascriptcamp_bot",
        } // { text: "Tact", url: "https://t.me/bot6" },
        ], [
          {
            text: "Ai Koshey",
            url: "https://t.me/ai_koshey_bot",
          },
        ]],
      },
    });
    await ctx.reply(
      lang
        ? "Сообщение с видео отправлено в канал."
        : "Message with video sent to the channel.",
    );
  } catch (error) {
    console.error("Failed to send message with video to the channel:", error);
    await ctx.reply(
      lang
        ? "Не удалось отправить сообщение с видео в канал."
        : "Failed to send message with video to the channel.",
    );
  }
});

const botLinks = async (ctx: Context, isRu: boolean) => {
  await ctx.reply(
    isRu
      ? "Наши боты по обучению искусственному интеллекту, JavaScript, TypeScript, React, Python, Tact, предоставляют уникальную возможность бесплатно заработать наш токен знаний $IGLA.\nВ отличие от других кликеров, наши боты позволяют пользователям проводить время с пользой, обучаясь востребованным навыкам, которые могут значительно повысить вашу профессиональную ценность на рынке труда"
      : "Our AI training bots, JavaScript, TypeScript, React, Python, Tact, provide a unique opportunity to earn our $IGLA knowledge token for free.\nUnlike other clickers, our bots allow users to spend time profitably learning in-demand skills who can significantly increase your professional value on the labor market",
    {
      reply_markup: {
        inline_keyboard: [[
          // { text: "Automatization", url: "https://t.me/bot1" },
          { text: "TypeScript", url: "https://t.me/typescript_dev_bot" },
          { text: "Python", url: "https://t.me/python_ai_dev_bot" },
        ], [{ text: "React", url: "https://t.me/react_native_dev_bot" }, {
          text: "JavaScript",
          url: "https://t.me/javascriptcamp_bot",
        } // { text: "Tact", url: "https://t.me/bot6" },
        ], [
          {
            text: "Ai Koshey",
            callback_data: "start_test",
          },
        ]],
      },
    },
  );
  return;
};

botAiKoshey.command("bots", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  await botLinks(ctx, lang);
  return;
});

botAiKoshey.command("soul", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  console.log("soul");
  await ctx.reply(lang ? "Чтобы наполнить вашего аватара душой, нажмите кнопку ниже" : "To fill your avatar's soul, click the button below", {
    reply_markup: {
      inline_keyboard: [[{
        text: lang ? "Создать душу" : "Create soul",
        callback_data: "create_soul",
      }]],
    },
  });
  return;
});

// Обработчик команды "start"
botAiKoshey.command("start", async (ctx: AiKosheyContext) => {
  await ctx.replyWithChatAction("typing");
  console.log(ctx.from?.language_code, "ctx.from.language_code")

  const params = ctx?.message?.text && ctx?.message?.text.split(" ")[1];

  const message = ctx.update.message;
  const username = message?.from?.username;
  const telegram_id = message?.from?.id.toString();
  const language_code = message?.from?.language_code;
  if (!ctx.from) throw new Error("User not found");
  console.log(await isRu(ctx), "isRu")
  const lang = await isRu(ctx)

  const chatIdSubscription = lang ? "-1002228291515" : "-1002015840738"
  const isSubscription = await checkSubscription(
    ctx,
    ctx.from?.id,
    chatIdSubscription
  );
  if (!isSubscription) {
    await ctx.reply(lang ? "Вы не подписаны на канал. Чтобы продолжить тест, нужно подписаться 👁‍🗨" : "You are not subscribed to the channel. To continue the test, you need to subscribe to the channel 👁‍🗨",
      {
        reply_markup: { inline_keyboard: [
          [{ text: lang ? "👁‍🗨 Подписаться" : "👁‍🗨 Subscribe", url: lang ? "https://t.me/ai_koshey999nft" : "https://t.me/ai_koshey_en" }],
        ] }
        }
      );
      return;
    }

  if(!ctx.from.username) {
    await ctx.reply(lang ? "🔍 Для использования бота, необходимо иметь username" : "🔍 To use the bot, you must have a username")
    return
  }

  if (params) {
    const underscoreIndex = params.indexOf("_"); // Search for the index of the first '_'

    if (underscoreIndex !== -1) {
      const select_izbushka = params.substring(0, underscoreIndex); // Extract the part before '_'
      const inviter = await getUsernameByTelegramId(params.substring(underscoreIndex + 1), ctx, lang);
      if (!inviter) {
        await ctx.reply(lang ? "Сылка недействительна" : "Invalid link")
        return
      }

      // Check if the selected hut and inviter exist
      if (select_izbushka && inviter) {
        try {
          // Check if the inviter exists
          const { isInviterExist, inviter_user_id, invitation_codes } =
            await checkUsernameCodes(inviter);

          console.log(isInviterExist, "373 isInviterExist")
          if (isInviterExist && invitation_codes) {
            const first_name = message?.from?.first_name;
            const last_name = message?.from?.last_name || "";

            if (username && telegram_id) {
              await ctx.replyWithChatAction("typing");
              // Check if the user exists and create it if it doesn't
              const { isUserExist, user } = await checkAndReturnUser(
                telegram_id,
              );
              console.log(isUserExist, "384 isUserExist")

              if (isUserExist === false || !user?.inviter) {
                console.log(387)
                if (
                  first_name && username &&
                  message?.from?.id && !user?.inviter &&
                    message?.from?.language_code && message?.chat?.id
                  ) {
                    console.log("392")
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
                  await ctx.replyWithChatAction("typing");
                  const user = await createUser(userObj);
                  console.log(user, "user 407")
                  console.log("356 sendMenu");
                  await welcomeMenu(ctx);
                  await startIzbushka(ctx);
                  return;
                }
              } else {
                const { isUserExist, user } = await checkAndReturnUser(
                  telegram_id,
                );
                if (isUserExist && user?.inviter) {
                  await ctx.replyWithChatAction("typing");
                  const { izbushka } = await getSelectIzbushkaId(
                    select_izbushka,
                  );

                  if (
                    izbushka && user && first_name &&
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

                    const isPassportExist = await checkPassportByRoomId(
                      user.user_id,
                      izbushka.room_id,
                      "room",
                    );

                    if (!isPassportExist) {
                      await setPassport(passport_user);
                    }

                    if (select_izbushka && telegram_id) {
                      await setSelectedIzbushka(
                        telegram_id,
                        select_izbushka,
                      );
                    }

                    await startIzbushka(ctx);
                    return;
                  } else {
                    const textError = `${
                      lang
                        ? "🤔 Ошибка: getSelectIzbushkaId."
                        : "🤔 Error: getSelectIzbushkaId."
                    }\n${JSON.stringify(izbushka)}`;
                    await ctx.reply(
                      textError,
                    );
                    throw new Error(textError);
                  }
                }
              }
            }
          }
        } catch (error) {
          const textError = `${
            lang
              ? "🤔 Что-то пошло не так, попробуйте ещё раз."
              : "🤔 Something went wrong, try again."
          }\n${JSON.stringify(error)}`;
          await ctx.reply(textError);
          await bugCatcherRequest(
            "ai_koshey_bot (select_izbushka && inviter)",
            JSON.stringify(error),
          );
          return;
        }
      } else {
        if (username && telegram_id) {
          // Check if the user exists and send the corresponding message
          const { isUserExist, user } = await checkAndReturnUser(telegram_id);
          console.log(user, "user");
          if (isUserExist && user?.inviter) {
            console.log("440 sendMenu");
            language_code && await welcomeMenu(ctx);
          } else {
            language_code && await welcomeMessage(ctx);
          }
          return;
        } else {
          const textError = `${
            lang
              ? "🤔 Ошибка: Username not found."
              : "🤔 Error: Username not found."
          }`;
          await ctx.reply(textError);
          throw new Error(textError);
        }
      }
    }
  } else {
    if (username && telegram_id) {
      try {
        const { isUserExist, user } = await checkAndReturnUser(
          telegram_id,
        );

        if (isUserExist && user?.inviter) {
          console.log("465 sendMenu ", user.inviter);
          language_code && await welcomeMenu(ctx);
        } else {
          language_code && await welcomeMessage(ctx);
        }
        return;
      } catch (error) {
        await ctx.reply(
          `${
            lang
              ? "🤔 Ошибка: checkAndReturnUser."
              : "🤔 Error: checkAndReturnUser."
          }\n${error}`,
        );
        await bugCatcherRequest(
          "ai_koshey_bot (select_izbushka && inviter)",
          JSON.stringify(error),
        );
        throw new Error("Error: checkAndReturnUser.");
      }
    }
  }
});

botAiKoshey.command("buy", async (ctx) => {
  const lang = await isRu(ctx)
  ctx.reply(lang ? "🤝 Выберите уровень подписки, который выхотите приобрести" : "🤝 Select the level of subscription you want to purchase", {
    reply_markup: {
      inline_keyboard: [[{ text: lang ? "🔥 Огонь" : "🔥 Fire", callback_data: "buy_fire" }], [{ text: lang ? "🌊 Вода" : "🌊 Water", callback_data: "buy_water" }], [{ text: lang ? "🎺 Медные трубы" : "🎺 Copper pipes", callback_data: "buy_copper_pipes" }]],
    },
  })
  return;
});

botAiKoshey.on("pre_checkout_query", (ctx) => {
  ctx.answerPreCheckoutQuery(true)
  return;
});

botAiKoshey.on("message:successful_payment", async (ctx) => {
  const lang = await isRu(ctx)
  console.log("ctx 646(succesful_payment)", ctx)
  const level = ctx.message.successful_payment.invoice_payload
  if (!ctx.from?.username) throw new Error("No username");
  const user_id = await getUid(ctx.from.username)
  if (!user_id) throw new Error("No user_id");
  await sendPaymentInfo(user_id, level)
  ctx.reply(lang ? "🤝 Спасибо за покупку!" : "🤝 Thank you for the purchase!");
  return;
});

botAiKoshey.command("language", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const { user } = await checkAndReturnUser(ctx.from?.id.toString());
  const lang = await isRu(ctx)
  user && ctx.reply(lang ? "🌏 Выберите язык" : "🌏 Select language", {
    reply_markup: {
      inline_keyboard: [
        [{ text: lang ? "🇷🇺 Русский" : "🇷🇺 Russian", callback_data: "select_russian" }],
        [{ text: lang ? "🇬🇧 English" : "🇬🇧 English", callback_data: "select_english" }],
      ],
    },
  })
});

botAiKoshey.command("digital_avatar", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)

  await ctx.reply(
    lang ? "Создать цифрового аватара" : "Create digital avatar",
    {
      reply_markup: {
        inline_keyboard: [[{
          text: lang ? "Создать цифрового аватара" : "Create digital avatar",
          callback_data: "create_digital_avatar",
        }]],
      },
    },
  );
  return;
});

// botAiKoshey.command("text_to_speech", async (ctx) => {
//   await ctx.replyWithChatAction("typing");
//   const isRu = ctx.from?.language_code === "ru";

//   const text = isRu
//     ? "🔮 Пожалуйста, отправьте текст, который вы хотите преобразовать в голосовое сообщение."
//     : "🔮 Please send the text you want to convert to a voice message.";

//   await ctx.reply(text, {
//     reply_markup: {
//       force_reply: true,
//     },
//   });
//   return;
// });

// botAiKoshey.command("reset_voice", async (ctx) => {
//   await ctx.replyWithChatAction("typing");
//   const isRu = ctx.from?.language_code === "ru";
//   const telegram_id = ctx.from?.id.toString();

//   const text = isRu
//     ? "🔮 О, добрый молодец! Голос твоего цифрового аватара был успешно сброшен, и теперь ты можешь создать новый."
//     : "🔮 Oh, noble traveler! The voice of your digital avatar has been successfully reset, and now you can create a new one.";
//   try {
//     // Сбрасываем голос цифрового аватара
//     if (!telegram_id) throw new Error("No telegram_id");
//     await updateUser(telegram_id, { voice_id_elevenlabs: null });
//     const voice_id_elevenlabs = await getVoiceId(telegram_id);
//     await deleteVoice(voice_id_elevenlabs);
//     await ctx.reply(text);
//   } catch (error) {
//     await ctx.reply(
//       isRu
//         ? "🤔 Ошибка при сбросе голоса цифрового аватара."
//         : "🤔 Error resetting digital avatar voice.",
//     );
//     await bugCatcherRequest(
//       "ai_koshey_bot (reset_voice)",
//       JSON.stringify(error),
//     );
//     throw new Error("Error resetting digital avatar voice.");
//   }
// });

botAiKoshey.command("voice", async (ctx) => {
  console.log("voice");
  // await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  // const text = lang
  //   ? "🔮 О, добрый молодец! Пошли мне свой голос, и я, волшебным образом, буду говорить с тобой твоим собственным голосом, словно из сказки."
  //   : "🔮 Please send me a voice message, and I will use it to create a voice avatar that speaks in your own voice.";

  // ctx.reply(text);
  ctx.reply(lang ? "Чтобы использовать данную функцию, необходимо приобрести уровень water 🌊" : "To use this function, you need to purchase the water level 🌊")
});

botAiKoshey.command("face", async (ctx) => {
  console.log("face");
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  ctx.reply(lang ? "Чтобы использовать данную функцию, необходимо приобрести уровень water 🌊" : "To use this function, you need to purchase the water level 🌊")
})

botAiKoshey.command("brain", async (ctx) => {
  console.log("brain");
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  ctx.reply(lang ? "Чтобы использовать данную функцию, необходимо приобрести уровень water 🌊" : "To use this function, you need to purchase the water level 🌊")
})

botAiKoshey.command("top", async (ctx) => {
  console.log("top");
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  const top10Users = await getTop10Users();
  console.log(top10Users, "top10Users");
  const leaderboardText = top10Users.map((user, index) => {
    return `${index + 1}. ${user.username} - ${user.all} $IGLA`;
  }).join('\n');

  await ctx.reply(lang ? `Топ 10 пользователей:\n${leaderboardText}` : `Top 10 users:\n${leaderboardText}`);

})

botAiKoshey.on("message:voice", async (ctx) => {
  // const voice = ctx.msg.voice;
  // console.log(voice, "voice");
  // const fileId = voice.file_id;
  // // Получаем файл голосового сообщения
  // const file = await ctx.api.getFile(fileId);
  // const filePath = file.file_path;
  // const fileUrl = `https://api.telegram.org/file/bot${AI_KOSHEY}/${filePath}`;

  // console.log(fileUrl, "fileUrl");
  // // Отправляем файл в ElevenLabs для создания нового голоса
  // const telegram_id = ctx.from?.id.toString();
  // const username = ctx.from?.username;
  // if (!username) throw new Error("No username");

  // const voiceId = await createVoiceSyncLabs({
  //   fileUrl,
  //   username
  // });
  // console.log(voiceId, "voiceId");
  // if (voiceId) {
  //   await ctx.reply(`Голос успешно создан! Voice ID: ${voiceId}`);
  //   await updateUser(telegram_id, { voice_id_synclabs: voiceId });
  // } else {
  //   await ctx.reply("Ошибка при создании голоса.");
  // }
});

botAiKoshey.on("message:text", async (ctx: Context) => {
  await ctx.replyWithChatAction("typing");
  const inviter = ctx?.message?.text;
  const message = ctx.update.message;
  const language_code = message?.from?.language_code;
  const username = message?.from?.username;
  const telegram_id = message?.from?.id.toString();

  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)

  // Check if the message is a reply (if there is a reply_to_message)
  if (ctx?.message?.reply_to_message) {
    // Check if the original message text contains a specific text
    const query = ctx.message.text;
    const originalMessageText = ctx?.message?.reply_to_message?.caption
      ? ctx?.message?.reply_to_message?.caption
      : ctx?.message?.reply_to_message?.text;

    if (
      originalMessageText?.includes(
        "🔮 Пожалуйста, отправьте текст, который вы хотите преобразовать в голосовое сообщение.",
      ) ||
      originalMessageText?.includes(
        "🔮 Please send the text you want to convert to a voice message.",
      )
    ) {
      // await ctx.replyWithChatAction("record_voice");
      // const telegram_id = ctx.from?.id.toString()
      // const botToken = AI_KOSHEY as string
      // if (!telegram_id) throw new Error("No telegram_id")
      // const voice_id_elevenlabs = await getVoiceId(telegram_id)
      // if (!voice_id_elevenlabs) throw new Error("No voice_id_elevenlabs")
      // if (!query) throw new Error("No query")
      // const audio_url = await createVoiceMessage(query, voice_id_elevenlabs, telegram_id, botToken)
      // console.log(audio_url)
      ctx.reply("test");
      return;
    }
    if (ctx?.message?.reply_to_message) {
      console.log(ctx);
      const originalMessageText = ctx?.message?.reply_to_message?.caption
        ? ctx?.message?.reply_to_message?.caption
        : ctx?.message?.reply_to_message?.text;
      if (
        originalMessageText &&
        originalMessageText.includes(lang ? "Пришли текст" : "Send text")
      ) {
        const text = ctx?.message?.text || "";

        if (!text && !message?.from?.id) throw new Error("No text or user_id");
        if (!username) throw new Error("No username");
        if (!telegram_id) throw new Error("No telegram_id");

        const { user } = await checkAndReturnUser(
          telegram_id,
        );

        if (!user) throw new Error("User not found");

        await createVideo({
          avatar_id: user?.avatar_id,
          voice_id: user?.voice_id,
          text,
          user_id: user.user_id,
        });
        await ctx.reply(
          `${
            language_code === "ru"
              ? "Ожидайте, скоро вам придет видео"
              : "Wait, your video is ready"
          }`,
        );
        return;
      }

      if (
        ctx.from && originalMessageText && originalMessageText.includes(
          lang
            ? "Пожалуйста, укажите ваше avatar_id"
            : "Please, specify your avatar_id:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { avatar_id: query });
        await ctx.reply(
          lang
            ? "Пожалуйста, укажите ваше voice_id:"
            : "Please, specify your voice_id:",
          {
            reply_markup: { force_reply: true },
          },
        );
        return;
      }

      if (
        ctx.from && originalMessageText && originalMessageText.includes(
          lang
            ? "Пожалуйста, укажите ваше voice_id"
            : "Please, specify your voice_id:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { voice_id: query });
        await ctx.reply(
          lang
            ? "Ваш Digital Avatar создан!"
            : "Your Digital Avatar is created!",
        );
        return;
      }

      if (
        ctx.from && originalMessageText && originalMessageText.includes(
          lang
            ? "Пожалуйста, укажите ваше audio_id"
            : "Please, specify your audio_id:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { audio_id: query });
        await ctx.reply(
          lang
            ? "Пожалуйста, укажите ваше avatar_id:"
            : "Please, specify your avatar_id:",
          {
            reply_markup: { force_reply: true },
          },
        );
        return;
      }

      if (
        ctx.from && originalMessageText && originalMessageText.includes(
          lang
            ? "Пожалуйста, укажите ваше место работы:"
            : "Please, specify your company name:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { company: query });
        await ctx.reply(
          lang
            ? "Пожалуйста, укажите вашу должность:"
            : "Please, specify your designation:",
          {
            reply_markup: { force_reply: true },
          },
        );
        return;
      }

      if (
        ctx.from && originalMessageText && originalMessageText.includes(
          lang
            ? "Пожалуйста, укажите вашу должность:"
            : "Please, specify your designation:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { position: query });
        await ctx.reply(
          lang
            ? "Пожалуйста, укажите ваши навыки и интересы:"
            : "Please, specify your skills and interests:",
          {
            reply_markup: { force_reply: true },
          },
        );
        return;
      }

      if (
        ctx.from && originalMessageText && originalMessageText.includes(
            lang
            ? "Пожалуйста, укажите ваши навыки и интересы:"
            : "Please, specify your skills and interests:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { designation: query });
        await ctx.reply(
          lang
            ? "Спасибо за предоставленную информацию!"
            : "Thank you for the provided information!",
        );
        return;
      }
    }

    console.log(originalMessageText, "originalMessageText");
    if (
      originalMessageText || originalMessageText &&
        (originalMessageText.includes("🏰 Добро пожаловать") ||
          originalMessageText.includes("🏰 Welcome") ||
          originalMessageText.includes("🔒 Oh, my apologies!") ||
          originalMessageText.includes("🔒 Ох, увы и ах!"))
    ) {
      try {
        const { isInviterExist, inviter_user_id } = await checkUsernameCodes(
          inviter as string,
        );

        if (isInviterExist) {
          console.log(message, "message");
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
          console.log(user, "user");
          const newUser = await createUser(user);
          await ctx.replyWithChatAction("typing");

          if (newUser) {
            await ctx.replyWithVideo(videoUrl(lang), {
              caption: await intro(ctx),
              reply_markup: {
                inline_keyboard: await menuButton(ctx),
              },
            });
            await botLinks(ctx, lang);
          }
          return;
        } else {
          await ctx.reply(await textError(ctx), {
            reply_markup: {
              force_reply: true,
            },
          });
          return;
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log("else!!!");
      return;
    }
  } else {
    await ctx.replyWithChatAction("typing");
    const query = ctx?.message?.text;

    const username = ctx?.update?.message?.from?.username;

    if (!username || !language_code) return;

    const id_array = await getPassportsTasksByUsername(username);

    if (query && id_array && id_array.length > 0) {
      const { ai_content, tasks } = await getAiFeedbackFromSupabase({
        query,
        id_array,
        username,
        language_code,
      });

      let tasksMessage = `📝 ${lang ? "Задачи:\n" : "Tasks:\n"}`;
      tasks.forEach((task) => {
        tasksMessage += `\n${task.title}\n${task.description}\n`;
      });

      await ctx.reply(`${ai_content}\n\n${tasksMessage}`, {
        parse_mode: "Markdown",
      });
      return;
    } else {
      const textError = `${
        lang
          ? "🤔 Ошибка: не удалось загрузить задачи."
          : "🤔 Error: failed to load tasks."
      }`;
      await ctx.reply(textError);
      return;
    }
  }
});

botAiKoshey.on("callback_query:data", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  if (!ctx.from) throw new Error("User not found");
  const lang = await isRu(ctx)
  const callbackData = ctx.callbackQuery.data;

  const telegram_id = ctx.callbackQuery.from.id.toString();
  const username = ctx.update && ctx.update.callback_query.from.username;

  await ctx.replyWithChatAction("typing");
  console.log(ctx);
  const isHaveAnswer = callbackData.split("_").length === 4;

  if (callbackData.startsWith("buy")) {
    if (callbackData.endsWith("fire")) {
      await ctx.replyWithInvoice(
        lang ? "🔥 Огонь" : "🔥 Fire",
        "Вы получить подписку уровня 'Огонь'",
        "fire",
        "", // Оставьте пустым для цифровых товаров
        "XTR", // Используйте валюту Telegram Stars
        [{ label: "Цена", amount: 432 }],
      );
      return
    }
    if (callbackData.endsWith("water")) {
      await ctx.replyWithInvoice(
        lang ? "🌊 Вода" : "🌊 Water",
        "Вы получить подписку уровня 'Вода'",
        "water",
        "", // Оставьте пустым для цифровых товаров
        "XTR", // Используйте валюту Telegram Stars
        [{ label: "Цена", amount: 4754 }], // Цена в центах (10.00 Stars)
      );
      return
    }
    if (callbackData.endsWith("copper_pipes")) {
      await ctx.replyWithInvoice(
        lang ? "🎺 Медные трубы" : "🎺 Copper pipes",
        "Вы получить подписку уровня 'Медные трубы'",
        "copper_pipes",
        "", // Оставьте пустым для цифровых товаров
        "XTR", // Используйте валюту Telegram Stars
        [{ label: "Цена", amount: 47975 }], // Цена в центах (10.00 Stars)
      );
      return
    }
  }
  if (callbackData === "select_russian") {
    if (ctx.callbackQuery.from.id) {
    console.log("editMessageReplyMarkup")
    await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }); 
  }
    await setLanguage(ctx.from?.id.toString(), "ru");
    await ctx.reply("Выбран русский");
  }
  if (callbackData === "select_english") {
    if (ctx.callbackQuery.from.id) {
      console.log("editMessageReplyMarkup")
      await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }); 
    }
    await setLanguage(ctx.from?.id.toString(), "en");
    await ctx.reply("English selected");
  }

  if (
    callbackData.startsWith("start_test") ||
    callbackData.startsWith("automation")
  ) {
    if (callbackData === "start_test") {
      try {
        console.log(`start_test`)
        const questionContext = {
          lesson_number: 1,
          subtopic: 1,
        };

        const questions = await getQuestion({
          ctx: questionContext,
          language: "automation",
        });
        if (questions.length > 0) {
          const {
            topic: ruTopic,
            image_lesson_url,
            topic_en: enTopic,
          } = questions[0];

          const user_id = await getUid(ctx.callbackQuery.from.username || "");
          if (!user_id) {
            await ctx.reply("Пользователь не найден.");
            return;
          }
          const topic = lang ? ruTopic : enTopic;
          const allAnswers = await getCorrects({
            user_id: user_id.toString(),
            language: "all",
          });
          // Формируем сообщение
          const messageText =
            `${topic}\n\n<i><u>${lang ? "Теперь мы предлагаем вам закрепить полученные знания." : "Now we are offering you to reinforce the acquired knowledge."}</u></i>\n\n<b>${lang ? "Total: " : "Total: "}${allAnswers} $IGLA</b>`;

          // Формируем кнопки
          const inlineKeyboard = [
            [{
              text: lang ? "Перейти к вопросу" : "Go to the question",
              callback_data: `automation_01_01`,
            }],
          ];

          if (image_lesson_url) {
            // Отправляем сообщение
            await ctx.replyWithPhoto(image_lesson_url || "", {
              caption: messageText,
              parse_mode: "HTML",
              reply_markup: { inline_keyboard: inlineKeyboard },
            });
            return;
          } else {
            await ctx.reply(messageText, {
              parse_mode: "HTML",
              reply_markup: { inline_keyboard: inlineKeyboard },
            });
            return;
          }
        } else {
          await ctx.reply(lang ? "Вопросы не найдены." : "No questions found.");
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (!isHaveAnswer) {
      try {
        const [language, lesson, subtopic] = callbackData.split("_");
        let questions;
        if (!isNaN(Number(lesson)) && !isNaN(Number(subtopic))) {
          // Значения корректны, вызываем функцию.
          const getQuestionContext = {
            lesson_number: Number(lesson),
            subtopic: Number(subtopic),
          };
          questions = await getQuestion({
            ctx: getQuestionContext,
            language,
          });
        } else {
          // Одно из значений некорректно, обрабатываем ошибку.
          console.error(
            "Одно из значений некорректно(96):",
            lesson,
            subtopic,
            callbackData,
          );
          await ctx.reply(
            lang
              ? "Одно из значений некорректно. Пожалуйста, проверьте данные."
              : "One of the values is incorrect. Please check the data.",
          );
          return;
        }
        const {
          question: ruQuestion,
          variant_0: ruVariant_0,
          variant_1: ruVariant_1,
          variant_2: ruVariant_2,
          question_en: enQuestion,
          variant_0_en: enVariant_0,
          variant_1_en: enVariant_1,
          variant_2_en: enVariant_2,
          id,
          image_lesson_url,
        } = questions[0];

        const question = lang ? ruQuestion : enQuestion;
        const variant_0 = lang ? ruVariant_0 : enVariant_0;
        const variant_1 = lang ? ruVariant_1 : enVariant_1;
        const variant_2 = lang ? ruVariant_2 : enVariant_2;

        const user_id = await getUid(ctx.callbackQuery.from.username || "");
        if (!user_id) {
          await ctx.reply("Пользователь не найден.");
          return;
        }
        console.log(user_id);
        const allAnswers = await getCorrects({
          user_id: user_id.toString(),
          language: "all",
        });
        // Формируем сообщение
        const messageText =
          `<b>№${id}</b>\n\n${question}\n\n<b> Total: ${allAnswers} $IGLA</b>`;

        // Формируем кнопки
        const inlineKeyboard = [
          [{
            text: variant_0 || "Variant 1",
            callback_data: `${callbackData}_0`,
          }],
          [{
            text: variant_1 || "Variant 2",
            callback_data: `${callbackData}_1`,
          }],
          [{
            text: variant_2 || (lang ? "Не знаю" : "I don't know"),
            callback_data: `${callbackData}_2`,
          }],
        ];

        if (image_lesson_url) {
          // Отправляем сообщение
          await ctx.editMessageCaption({
            reply_markup: { inline_keyboard: inlineKeyboard },
            caption: messageText,
            parse_mode: "HTML",
          });
        } else {
          await ctx.editMessageText(messageText, {
            reply_markup: { inline_keyboard: inlineKeyboard },
            parse_mode: "HTML",
          });
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (isHaveAnswer) {
      try {
        if (ctx.callbackQuery.from.id) {
          console.log("editMessageReplyMarkup")
          await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }); 
        }
        const [language, lesson_number, subtopic, answer] = callbackData.split(
          "_",
        );
        const questionContext = {
          lesson_number: Number(lesson_number),
          subtopic: Number(subtopic),
        };

        const questions = await getQuestion({ ctx: questionContext, language });
        if (questions.length > 0) {
          const {
            correct_option_id,
            id
          } = questions[0];
          const user_id = await getUid(ctx.callbackQuery.from.username || "");
          if (!user_id) {
            await ctx.reply(lang ? "Пользователь не найден." : "User not found.");
            return;
          }

          const path = `${language}_${lesson_number}_${subtopic}`;
          console.log(path, "path for getBiggest");
          const biggestSubtopic = await getBiggest({
            lesson_number: Number(lesson_number),
            language,
          });

          let isTrueAnswer = null;
          if (Number(correct_option_id) === Number(answer)) {
            isTrueAnswer = true;
            await ctx.reply("✅");
          } else {
            isTrueAnswer = false;
            await ctx.reply("❌");
          }
          await updateProgress({
            user_id: user_id.toString(),
            isTrue: isTrueAnswer,
            language,
          });
          console.log(biggestSubtopic, `biggestSubtopic`);
          console.log(subtopic, `subtopic`);
          const newPath = await pathIncrement({
            path,
            isSubtopic: Number(biggestSubtopic) === Number(subtopic)
              ? false
              : true,
          });
          const correctAnswers = await getCorrects({
            user_id: user_id.toString(),
            language,
          });
          const allAnswers = await getCorrects({
            user_id: user_id.toString(),
            language: "all",
          });

          const lastCallbackId = await getLastCallback(language);
          console.log(lastCallbackId);
          if (lastCallbackId) {
            if (questions[0].id === lastCallbackId) {
              const correctProcent = (correctAnswers / lastCallbackId) * 100;
              if (correctProcent >= 80) {
                await updateResult({
                  user_id: user_id.toString(),
                  language,
                  value: true,
                });
                await ctx.reply(
                  lang
                    ? `<b>🥳 Поздравляем, вы прошли основной тест! Далее вы сможете пройти дополнительные тесты от искуственного интеллекта.</b>\n\n Total: ${allAnswers} $IGLA`
                    : `<b>🥳 Congratulations, you passed the main test! Then you can pass the additional tests from the artificial intelligence.</b>\n\n Total: ${allAnswers} $IGLA`,
                  { parse_mode: "HTML" },
                );
              } else {
                await updateResult({
                  user_id: user_id.toString(),
                  language,
                  value: false,
                });
                await ctx.reply(
                  lang
                    ? `<b>🥲 Вы не прошли основной тест, но это не помешает вам развиваться! </b>\n\n Total: ${allAnswers} $IGLA`
                    : `<b>🥲 You didn't pass the main test, but that won't stop you from developing!</b>\n\n Total: ${allAnswers} $IGLA`,
                  { parse_mode: "HTML" },
                );
              }
            }
            console.log(newPath, `newPath ai koshey`);
            const [newLanguage, newLesson, newSubtopic] = newPath.split("_");
            const getQuestionContext = {
              lesson_number: Number(newLesson),
              subtopic: Number(newSubtopic),
            };
            const newQuestions = await getQuestion({
              ctx: getQuestionContext,
              language,
            });
            console.log(newQuestions, `newQuestions ai koshey for`);
            console.log(getQuestionContext, `getQuestionContext`);
            const { topic: ruTopic, image_lesson_url, topic_en: enTopic } =
              newQuestions[0];
            const topic = lang ? ruTopic : enTopic;
            // Формируем сообщение
            const messageText =
              `${topic}\n\n<i><u>${lang ? "Теперь мы предлагаем вам закрепить полученные знания." : "Now we are offering you to reinforce the acquired knowledge."}</u></i>\n\n<b>${lang ? "Total: " : "Total: "}${allAnswers} $IGLA</b>`;

            // Формируем кнопки
            const inlineKeyboard = [
              [{
                text: lang ? "Перейти к вопросу" : "Go to the question",
                callback_data: newPath,
              }],
            ];
            if (image_lesson_url) {
              // Отправляем сообщение
              await ctx.replyWithPhoto(image_lesson_url, {
                caption: messageText,
                parse_mode: "HTML",
                reply_markup: { inline_keyboard: inlineKeyboard },
              });
              return;
            } else {
              await ctx.reply(messageText, {
                parse_mode: "HTML",
                reply_markup: { inline_keyboard: inlineKeyboard },
              });
              return;
            }
          } else {
            await ctx.reply(lang ? "Вопросы не найдены." : "No questions found.");
          }
        } else {
          console.error("Invalid callback(289)");
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
  if (callbackData.startsWith("create_soul")) {
    if (ctx.callbackQuery.from.id) {
      console.log("editMessageReplyMarkup")
      await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }); 
    }
    await ctx.reply(
      lang
        ? "Пожалуйста, укажите ваше место работы:"
        : "Please, specify your company name:",
      { reply_markup: { force_reply: true } },
    );
    return;
  }

  if (callbackData.startsWith("create_digital_avatar")) {
    if (ctx.callbackQuery.from.id) {
      console.log("editMessageReplyMarkup")
      await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }); 
    }
    await ctx.reply(
      lang
        ? "Пожалуйста, укажите ваше video_id:"
        : "Please, specify your video_id:",
      { reply_markup: { force_reply: true } },
    );
    return;
  }

  const handleRoomSelection = async (
    ctx: Context,
    rooms: RoomNode[],
    type: string,
  ) => {
    try {
      if (rooms && rooms.length > 0) {
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

        await ctx.replyWithChatAction("typing");
        if (type === "fire") {
          const textFire = `🔥 ${
            lang
              ? "Пламя горячее - это личные избушки, где твои слова пишутся и задачи создаются."
              : "Fire is a private room where your words are written and tasks are created."
          }`;
          await ctx.reply(
            textFire,
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
          return;
        } else if (type === "water") {
          const textWater = `💧 ${
            lang
              ? "Воды чистые к себе манят, где гость ты в избушках дорогой."
              : "Water is pure to you, where guests are in the private rooms."
          }`;
          await ctx.reply(
            textWater,
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
          return;
        } else if (type === "copper_pipes") {
          const textCopperPipes = `🎺 ${
            lang
              ? "Медные трубы - это чародейские избушки, где обучение к мудрости тебя ведет."
              : "Copper pipes are the sacred huts where the training to wisdom guides you."
          }`;
          await ctx.reply(
            textCopperPipes,
            {
              reply_markup: { inline_keyboard: keyboard },
            },
          );
          return;
        }
        return;
      } else {
        const textError = `${
          lang
            ? "У вас нет избушек куда вас пригласили"
            : "You don't have any rooms where you were invited"
        }`;
        await ctx.reply(textError);
        return;
      }
    } catch (error) {
      const textError = `${
        lang ? "Ошибка при выборе избушки" : "Error selecting the room"
      }`;
      await ctx.reply(textError, error);
      throw new Error(textError);
    }
  };

  if (callbackData === "fire") {
    const rooms = username && (await getRooms(username));
    rooms && await handleRoomSelection(ctx, rooms, "fire");
  } else if (callbackData === "water") {
    const rooms = username && (await getRoomsWater(username));
    rooms && await handleRoomSelection(ctx, rooms, "water");
  } else if (callbackData === "copper_pipes") {
    const rooms = await getRoomsCopperPipes();
    rooms && await handleRoomSelection(ctx, rooms, "copper_pipes");
  }

  if (callbackData === "name_izbushka") {
    try {
      const textQuestion = `${
        lang ? "Как назовем избушку?" : "How do we name the room?"
      }`;
      await ctx.reply(textQuestion, {
        reply_markup: {
          force_reply: true,
        },
      });
      return;
    } catch (error) {
      console.error(error);
      await bugCatcherRequest("ai_koshey_bot (name_izbushka)", error);
      throw new Error("ai_koshey_bot (name_izbushka)");
    }
  }

  if (callbackData === "show_izbushka") {
    const rooms = username && (await getRooms(username));
    // console.log(rooms, "rooms");
    try {
      if (Array.isArray(rooms)) {
        const textSelectRoom = `${lang ? "🏡 Выберите избушку" : "Select the room"}`;
        await ctx.reply(textSelectRoom, {
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
        const textError = `${
          lang ? "Ошибка: не удалось загрузить избушки." : "Error: failed to load room."
        }`;
        await ctx.reply(textError);
        await bugCatcherRequest("ai_koshey_bot (show_izbushka)", ctx);
        throw new Error("ai_koshey_bot (show_izbushka)");
      }
      return;
    } catch (error) {
      console.error("error show_izbushka", error);
      await bugCatcherRequest("ai_koshey_bot (show_izbushka)", ctx);
      throw new Error("ai_koshey_bot (show_izbushka)");
    }
  }

  if (callbackData.includes("select_izbushka")) {
    try {
      const select_izbushka = callbackData.split("_")[2];

      if (select_izbushka) {
        telegram_id && await setSelectedIzbushka(telegram_id, select_izbushka);
      }
      const textForInvite = `${
        lang
          ? '📺 Что ж, путник дорогой, дабы трансляцию начать, нажми кнопку "Izbushka" смелее и веселись, ибо все приготовлено к началу твоего путешествия по цифровым просторам!\n\n🌟 Поделись следующей ссылкой с тем, с кем встретиться в Избушке на курьих ножках хочешь.'
          : 'What, traveler, to start the broadcast, press the "Izbushka" button more joyfully and laugh, because all is prepared for the start of your journey through the digital spaces! \n\n🌟 Share the following link with the person you want to meet in the hut on the curved tips of the hut.'
      }`;
      await ctx.reply(
        textForInvite,
      );
      await delay(500);

      const textInvite = `${
        lang
          ? `🏰 **Приглашение в Тридевятое Царство** 🏰\n[Нажми на ссылку чтобы присоединиться!](https://t.me/${botUsername}?start=${select_izbushka}_${telegram_id})\n\nПосле подключения к боту нажми на кнопку **Izbushka**, чтобы войти на видео встречу.\n[Инструкция подключения](https://youtube.com/shorts/YKG-1fdEtAs?si=ojKvK2DfPsZ0mbd5)`
          : `Invitation to the DAO 999 NFT\n[Press the link to join!](https://t.me/${botUsername}?start=${select_izbushka}_${telegram_id})\n\nAfter connecting to the bot, press the **Izbushka** button to enter the video meeting.\n[Instruction for connecting](https://youtube.com/shorts/YKG-1fdEtAs?si=ojKvK2DfPsZ0mbd5)`
      }`;

      await ctx.reply(textInvite, { parse_mode: "Markdown" });

      return;
    } catch (error) {
      await bugCatcherRequest("ai_koshey_bot (select_izbushka)", error);
      throw new Error("ai_koshey_bot (select_izbushka)");
    }
  }
});

await botAiKoshey.api.setMyCommands([
  {
    command: "/start",
    description: "🚀 Start chatting with Ai Koshey",
  },
  // {
  //   command: "/avatar",
  //   description: "Create a digital avatar",
  // },
  {
    command: "/course",
    description: "📚 Start the course",
  },
  {
    command: "/language",
    description: "🌐 Select language",
  },
  {
    command: "/soul",
    description: "🆔 Fill your avatar's soul",
  },
  {
    command: "/face",
    description: "🤓 Add avatar's face",
  },
  {
    command: "/brain",
    description: "🧠 Add avatar's brain",
  },
  // {
  //   command: "/text_to_speech",
  //   description: "Convert text to speech",
  // },
  {
    command: "/voice",
    description: "🎤 Add avatar's voice",
  },
  {
    command: "/top",
    description: "🏆 Top 10 users",
  },
  // {
  //   command: "/buy",
  //   description: "🛒 Buy subscription",
  // },
  // {
  //   command: "/reset_voice",
  //   description: "Reset voice ai-avatar",
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
    throw e;
  } else {
    console.error("Unknown error:", e);
    throw e;
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

// const textInvite = `${
//   isRu
//     ? `🏰 **Приглашение в Тридевятое Царство** 🏰\n\n[Нажми на ссылку чтобы присоединиться!](https://t.me/${botUsername}?start=${select_izbushka}_${username})\n\nПосле подключения к боту нажми на кнопку **Izbushka**, чтобы войти на видео встречу.`
//     : `Invitation to the **DAO 999 NFT**\n\nPress the link to join!](https://t.me/${botUsername}?start=${select_izbushka}_${username})\n\nAfter connecting to the bot, press the **Izbushka** button to enter the video meeting.`
// }`;
// const buttons = [
//   {
//     text: `${
//       isRu
//         ? "Видео инструкция подключения"
//         : "Video instruction for connecting"
//     }`,
//     web_app: {
//       url: `https://youtube.com/shorts/YKG-1fdEtAs?si=ojKvK2DfPsZ0mbd5`,
//     },
//   },
// ];

// supabase functions deploy ai-koshey --no-verify-jwt
