// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import {
  Context,
  GrammyError,
  HttpError,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";

import { delay } from "../_shared/constants.ts";
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
import { getAiFeedbackFromSupabase } from "../_shared/supabase/ai.ts";
import { createVideo } from "../_shared/heygen/index.ts";

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

const videoUrl = "https://t.me/dao999nft_storage/2";

const startIzbushka = async (ctx: Context) => {
  try {
    const isRu = ctx.from?.language_code === "ru";
    // const text = isRu
    //   ? `🏰 Избушка повернулась к тебе передом, а к лесу задом. Нажми кнопку "Izbushka", чтобы начать встречу.`
    //   : `🏰 The hut turned its front to you, and its back to the forest. Tap the "Izbushka" button to start the encounter.`;

    const buttons = [
      {
        text: `${isRu ? "Войти в Избушку" : "Enter the room"}`,
        web_app: { url: "https://dao999nft.com/show-izbushka" },
      },
    ];

    const text = isRu
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
    throw new Error("startIzbushka", error);
  }
};

const textError = (ctx:Context) => {
  const isRu = ctx.from?.language_code === "ru";
  return `🔒 ${
    isRu
    ? "Ох, увы и ах! Словечко, что до меня дошло, чарам тайным не отвечает. Прошу, дай знать иное, что ключом является верным, чтоб путь твой в царство дивное открыть сумели без замедления."
    : "Oh, my apologies! The word that came to me, the secret does not answer. Please, tell me another word that is the key to the right path, so that the path of your life is a strange and open way to the kingdom."
}`;
}

const welcomeMenu = async (ctx: Context) => {
  await ctx.replyWithChatAction("upload_video"); // Отправка действия загрузки видео в чате
  const isRu = ctx.from?.language_code === "ru";

  const text = isRu
  ? `🏰 Избушка повернулась к тебе передом, а к лесу задом. Налево пойдешь - огнем согреешься, прямо пойдешь - в водичке омолодишься, а направо пойдешь - в медную трубу попадешь.`
  : `🏰 The hut turned its front to you, and its back to the forest. If you go to the left you will be warmed by the fire, you will go straight ahead in the water and you will rejuvenate, and to the right you will go into a copper pipe.`;

  await ctx.replyWithVideo(videoUrl, {
    caption: text,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `🔥 ${isRu ? "Огонь" : "Fire"}`,
            callback_data: "fire",
          },
          {
            text: `💧 ${isRu ? "Вода" : "Water"}`,
            callback_data: "water",
          },
          {
            text: `🎺 ${isRu ? "Медные трубы" : "Copper pipes"}`,
            callback_data: "copper_pipes",
          },
        ],
      ],
    },
  });
  
  await botLinks(ctx, isRu);
  return;
};

const welcomeMessage = async (ctx: Context) => {
  const isRu = ctx.from?.language_code === "ru";
  const text = isRu
    ? `🏰 Добро пожаловать в Тридевятое Царство, ${ctx?.update?.message?.from?.first_name}! \nВсемогущая Баба Яга, владычица тайн и чародейница, пред врата неведомого мира тебя привечает.\nЧтоб изба к тебе передком обернулась, а не задом стояла, не забудь прошептать кабы словечко-проходное.`
    : `🏰 Welcome, ${ctx?.update?.message?.from?.first_name}! \nThe all-powerful Babya Yaga, the ruler of secrets and charms, is preparing to confront you with the gates of the unknown world.\nTo save you from the front and not the back, remember to speak the word-a-word.`;
  await ctx.reply(
    text,
    {
      reply_markup: {
        force_reply: true,
      },
    },
  );
  return;
};

const intro = ({ language_code = "en" }: { language_code?: string }) => {
  const isRu = language_code === "ru";
  const intro = isRu
    ? `🏰 Избушка повернулась к тебе передом, а к лесу задом. На лево пойдешь огонем согреешься, прямо пойдешь в водичке омолодишься, а на право пойдешь в медную трубу попадешь.`
    : `🏰 The hut turned its front to you, and its back to the forest. If you go to the left you will be warmed by the fire, you will go straight ahead in the water and you will rejuvenate, and to the right you will go into a copper pipe.
`;
  return intro;
};

const menuButton = ({ language_code = "en" }: { language_code?: string }) => {
  const isRu = language_code === "ru";
  const menuButton = [
    [
      {
        text: `🔥 ${isRu ? "Огонь" : "Fire"}`,
        callback_data: "fire",
      },
      {
        text: `🎺 ${isRu ? "Медные трубы" : "Copper pipes"}`,
        callback_data: "copper_pipes",
      },
      {
        text: `💧 ${isRu ? "Вода" : "Water"}`,
        callback_data: "water",
      },
    ],
  ];
  return menuButton;
};

// Обработчик команды "avatar"
botAiKoshey.command("avatar", async (ctx: AiKosheyContext) => {
  const isRu = ctx.from?.language_code === "ru";
  await ctx.replyWithChatAction("typing");

  await ctx.reply(
    `${isRu ? "Пришли текст" : "Send text"}`,
    {
      reply_markup: {
        force_reply: true,
      },
    },
  );
  return;
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
        ]],
      },
    },
  );
  return;
};

botAiKoshey.command("bots", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  const isRu = ctx.from?.language_code === "ru";
  await botLinks(ctx, isRu);
  return;
});

botAiKoshey.command("profile", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  const isRu = ctx.from?.language_code === "ru";

  await ctx.reply(isRu ? "Создать профиль" : "Create profile", {
    reply_markup: {
      inline_keyboard: [[{
        text: isRu ? "Создать профиль" : "Create profile",
        callback_data: "create_profile",
      }]],
    },
  });
  return;
});

// Обработчик команды "start"
botAiKoshey.command("start", async (ctx: AiKosheyContext) => {
  await ctx.replyWithChatAction("typing");

  const params = ctx?.message?.text && ctx?.message?.text.split(" ")[1];

  const message = ctx.update.message;
  const username = message?.from?.username;
  const language_code = message?.from?.language_code;
  const isRu = ctx.from?.language_code === "ru";

  if (params) {
    const underscoreIndex = params.indexOf("_"); // Search for the index of the first '_'
    if (underscoreIndex !== -1) {
      const select_izbushka = params.substring(0, underscoreIndex); // Extract the part before '_'
      const inviter = params.substring(underscoreIndex + 1); // Extract all after '_'

      // Check if the selected hut and inviter exist
      if (select_izbushka && inviter) {
        try {
          // Check if the inviter exists
          const { isInviterExist, inviter_user_id, invitation_codes } =
            await checkUsernameCodes(inviter);

          if (isInviterExist && invitation_codes) {
            const first_name = message?.from?.first_name;
            const last_name = message?.from?.last_name || "";

            if (username) {
              await ctx.replyWithChatAction("typing");
              // Check if the user exists and create it if it doesn't
              const { isUserExist } = await checkAndReturnUser(
                username,
              );

              if (!isUserExist) {
                if (
                  first_name && username &&
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
                  await ctx.replyWithChatAction("typing");
                  await createUser(userObj);
                  await welcomeMenu(ctx);
                  await startIzbushka(ctx);
                  return;
                }
              } else {
                const { isUserExist, user } = await checkAndReturnUser(
                  username,
                );
                if (isUserExist) {
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

                    if (select_izbushka && username) {
                      await setSelectedIzbushka(
                        username,
                        select_izbushka,
                      );
                    }

                    await startIzbushka(ctx);
                    return;
                  } else {
                    const textError = `${
                      isRu
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
            isRu
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
        if (username) {
          // Check if the user exists and send the corresponding message
          const { isUserExist } = await checkAndReturnUser(username);
          if (isUserExist) {
            language_code && await welcomeMenu(ctx);
          } else {
            language_code && await welcomeMessage(ctx);
          }
          return;
        } else {
          const textError = `${
            language_code === "ru"
              ? "🤔 Ошибка: Username not found."
              : "🤔 Error: Username not found."
          }`;
          await ctx.reply(textError);
          throw new Error(textError);
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
          language_code && await welcomeMenu(ctx);
        } else {
          language_code && await welcomeMessage(ctx);
        }
        return;
      } catch (error) {
        await ctx.reply(
          `${
            isRu
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

botAiKoshey.command("digital_avatar", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  const isRu = ctx.from?.language_code === "ru";

  await ctx.reply(
    isRu ? "Создать цифрового аватара" : "Create digital avatar",
    {
      reply_markup: {
        inline_keyboard: [[{
          text: isRu ? "Создать цифрового аватара" : "Create digital avatar",
          callback_data: "create_digital_avatar",
        }]],
      },
    },
  );
  return;
});

botAiKoshey.on("message:text", async (ctx: Context) => {
  await ctx.replyWithChatAction("typing");
  const inviter = ctx?.message?.text;
  const message = ctx.update.message;
  const language_code = message?.from?.language_code;
  const username = message?.from?.username;

  const isRu = ctx.from?.language_code === "ru";

  // Check if the message is a reply (if there is a reply_to_message)
  if (ctx?.message?.reply_to_message) {
    // Check if the original message text contains a specific text
    const query = ctx.message.text;
    const originalMessageText = ctx?.message?.reply_to_message?.text;

    if (ctx?.message?.reply_to_message) {
      const originalMessageText = ctx?.message?.reply_to_message?.text;
      if (
        originalMessageText &&
        originalMessageText.includes(isRu ? "Пришли текст" : "Send text")
      ) {
        const text = ctx?.message?.text || "";

        if (!text && !message?.from?.id) throw new Error("No text or user_id");
        if (!username) throw new Error("No username");

        const { user } = await checkAndReturnUser(
          username,
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
              ? "Ожидайте, скоро вам прийдет видео"
              : "Wait, your video is ready"
          }`,
        );
        return;
      }

      if (
        ctx.from && originalMessageText && originalMessageText.includes(
          isRu
            ? "Пожалуйста, укажите ваше avatar_id"
            : "Please, specify your avatar_id:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { avatar_id: query });
        await ctx.reply(
          isRu
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
          isRu
            ? "Пожалуйста, укажите ваше voice_id"
            : "Please, specify your voice_id:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { voice_id: query });
        await ctx.reply(
          isRu
            ? "Ваш Digital Avatar создан!"
            : "Your Digital Avatar is created!",
        );
        return;
      }

      if (
        ctx.from && originalMessageText && originalMessageText.includes(
          isRu
            ? "Пожалуйста, укажите ваше audio_id"
            : "Please, specify your audio_id:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { audio_id: query });
        await ctx.reply(
          isRu
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
          isRu
            ? "Пожалуйста, укажите ваше место работы:"
            : "Please, specify your company name:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { company: query });
        await ctx.reply(
          isRu
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
          isRu
            ? "Пожалуйста, укажите вашу должность:"
            : "Please, specify your designation:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { position: query });
        await ctx.reply(
          isRu
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
          isRu
            ? "Пожалуйста, укажите ваши навыки и интересы:"
            : "Please, specify your skills and interests:",
        )
      ) {
        await updateUser(ctx.from.id.toString(), { designation: query });
        await ctx.reply(
          isRu
            ? "Спасибо за предоставленную информацию!"
            : "Thank you for the provided information!",
        );
        return;
      }
    }

    if (
      originalMessageText &&
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

          const videoResponse = await fetch(videoUrl);
          if (!videoResponse.ok) {
            const errorText = await videoResponse.text();
            await bugCatcherRequest("sendVideo", `Failed to fetch video: ${errorText}`);
            throw new Error(`Failed to fetch video: ${errorText}`);
          }

          newUser && await ctx.replyWithVideo(videoUrl, {
            caption: intro({ language_code }),
            reply_markup: {
              inline_keyboard: menuButton({ language_code }),
            },
          });
          await botLinks(ctx, isRu);
          return;
        } else {

          await ctx.replyWithVideo(videoUrl, {
            caption: textError(ctx),
            reply_markup: {
              force_reply: true,
            },
          });
          await botLinks(ctx, isRu);
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

      let tasksMessage = `📝 ${isRu ? "Задачи:\n" : "Tasks:\n"}`;
      tasks.forEach((task) => {
        tasksMessage += `\n${task.title}\n${task.description}\n`;
      });

      await ctx.reply(`${ai_content}\n\n${tasksMessage}`, {
        parse_mode: "Markdown",
      });
      return;
    } else {
      const textError = `${
        isRu
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
  const isRu = ctx.from?.language_code === "ru";
  const callbackData = ctx.callbackQuery.data;

  const username = ctx.update && ctx.update.callback_query.from.username;

  if (callbackData.startsWith("create_profile")) {
    await ctx.reply(
      isRu
        ? "Пожалуйста, укажите ваше место работы:"
        : "Please, specify your company name:",
      { reply_markup: { force_reply: true } },
    );
    return;
  }

  if (callbackData.startsWith("create_digital_avatar")) {
    await ctx.reply(
      isRu
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
            isRu
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
            isRu
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
            isRu
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
          isRu
            ? "У вас нет избушек куда вас пригласили"
            : "You don't have any rooms where you were invited"
        }`;
        await ctx.reply(textError);
        return;
      }
    } catch (error) {
      const textError = `${
        isRu ? "Ошибка при выборе избушки" : "Error selecting the room"
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
        isRu ? "Как назовем избушку?" : "How do we name the room?"
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
        const textSelectRoom = `${
          isRu ? "🏡 Выберите избушку" : "Select the room"
        }`;
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
          isRu
            ? "Ошибка: не удалось загрузить избушки."
            : "Error: failed to load room."
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
        username && await setSelectedIzbushka(username, select_izbushka);
      }
      const textForInvite = `${
        isRu
          ? '📺 Что ж, путник дорогой, дабы трансляцию начать, нажми кнопку "Izbushka" смелее и веселись, ибо все приготовлено к началу твоего путешествия по цифровым просторам!\n\n🌟 Поделись следующей ссылкой с тем, с кем встретиться в Избушке на курьих ножках хочешь.'
          : 'What, traveler, to start the broadcast, press the "Izbushka" button more joyfully and laugh, because all is prepared for the start of your journey through the digital spaces! \n\n🌟 Share the following link with the person you want to meet in the hut on the curved tips of the hut.'
      }`;
      await ctx.reply(
        textForInvite,
      );
      await delay(500);

      const textInvite = `${
        isRu
          ? `🏰 **Приглашение в Тридевятое Царство** 🏰\n[Нажми на ссылку чтобы присоединиться!](https://t.me/${botUsername}?start=${select_izbushka}_${username})\n\nПосле подключения к боту нажми на кнопку **Izbushka**, чтобы войти на видео встречу.\n[Инструкция подключения](https://youtube.com/shorts/YKG-1fdEtAs?si=ojKvK2DfPsZ0mbd5)`
          : `Invitation to the DAO 999 NFT\n[Press the link to join!](https://t.me/${botUsername}?start=${select_izbushka}_${username})\n\nAfter connecting to the bot, press the **Izbushka** button to enter the video meeting.\n[Instruction for connecting](https://youtube.com/shorts/YKG-1fdEtAs?si=ojKvK2DfPsZ0mbd5)`
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
    description: "Start chatting with Ai Koshey",
  },
  {
    command: "/avatar",
    description: "Create a digital avatar",
  },
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
