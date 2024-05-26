import {
  getBiggest,
  getCorrects,
  getLastCallback,
  getQuestion,
  resetProgress,
  updateProgress,
  updateResult,
} from "../_shared/supabase/progress.ts";
import { getUid } from "../_shared/supabase/users.ts";
import { pathIncrement } from "../path-increment.ts";""

import { checkSubscription } from "../check-subscription.ts";
import {
  handleUpdateTypeScript,
  typeScriptDevBot,
} from "../_shared/telegram/bots.ts";
import { HttpError } from "https://deno.land/x/grammy@v1.22.4/mod.ts";
import { GrammyError } from "https://deno.land/x/grammy@v1.22.4/core/error.ts";
import { createUser } from "../_shared/nextapi/index.ts";
import { getAiFeedbackFromSupabase } from "../_shared/supabase/ai.ts";
import { Context } from "https://deno.land/x/grammy@v1.8.3/mod.ts";

const videoUrl = "https://t.me/dao999nft_storage/2";

typeScriptDevBot.command("start", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  await createUser({
    username: ctx.from?.username || "",
    first_name: ctx.from?.first_name || "",
    last_name: ctx.from?.last_name || "",
    is_bot: ctx.from?.is_bot || false,
    language_code: ctx.from?.language_code || "",
    chat_id: ctx.chat.id,
    telegram_id: ctx.from?.id || 0,
    inviter: "",
  });
  const isSubscription = await checkSubscription(
    ctx,
    ctx.from?.id || 0,
    "-1002228291515",
  );
  console.log(isSubscription, "isSubscription")
  const isRu = ctx.from?.language_code === "ru";

  if (isSubscription === true) {
    await ctx.reply(
      isRu
        ? `🚀 Привет, ${ctx.from?.first_name}! \nДобро пожаловать в твоего персонального помощника по изучению языка программирования TypeScript с помощью искусственного интеллекта! Здесь ты сможешь не только освоить основы TypeScript, но и изучить более сложные темы через интерактивное обучение и общение.\n\n🖥️ Я здесь, чтобы предложить тебе обзор тем начального уровня, помочь решить задачи и пройти тестирование, а также ответить на любые вопросы по ходу твоего обучения. Наше общение будет строиться на основе последних достижений в области искусственного интеллекта, что сделает твой учебный процесс еще более эффективным и увлекательным.\n\n💡 Готов начать увлекательное путешествие в мир TypeScript? \nНачать тест(кнопка)`
        : `🚀 Hi, ${ctx.from?.first_name}! \nWelcome to your personal assistant to learn TypeScript programming language with artificial intelligence! Here you can not only learn the basics of TypeScript, but also explore more advanced topics through interactive learning and communication.\n\n🖥️ I'm here to offer you an overview of entry-level topics, help you solve problems and take tests, and answer any questions as you learn. Our communication will be based on the latest advances in artificial intelligence, making your learning experience even more effective and fun.\n\n\n💡 Ready to start your exciting journey into the world of TypeScript? \nStart Test(button)`,
      // ctx.t("startTypeScript"),
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: isRu ? "Начать тест!" : "Start Test!", callback_data: "start_test" }],
          ],
        },
      },
    );
  } else if (isSubscription === false) {
    // const messageText = isRu
    //   ? `<b>Курс Автоматизация🤖 BotMother</b>\nПрограммирование под руководством нейронных помощников. Вы изучите JavaScript, Python, TypeScript, React & React Native, Тасt, GraphQL, Apollo и интеграцию с блокчейном TON и Telegram Mini App`
    //   : `<b>Automation Course🤖 BotMother</b>\nProgramming under the guidance of neural assistants. You will learn JavaScript, Python, TypeScript, React & React Native, TAST, GraphQL, Apollo and integration with the TON blockchain and Telegram Mini App`;
    // await ctx.replyWithPhoto(
    //   isRu
    //     ? "https://subscribebot.org/api/v1/snippet/subscription/19957?cache_key=OTk5OTAwX9Ca0YPRgNGBINCQ0LLRgtC+0LzQsNGC0LjQt9Cw0YbQuNGP8J+kliBCb3RNb3RoZXJf0J/RgNC+0LPRgNCw0LzQvNC40YDQvtCy0LDQvdC40LUg0L/QvtC0INGA0YPQutC+0LLQvtC00YHRgtCy0L7QvCDQvdC10LnRgNC+0L3QvdGL0YUg0L/QvtC80L7RidC90LjQutC+0LIuINCS0Ysg0LjQt9GD0YfQuNGC0LUgSmF2YVNjcmlwdCwgUHl0aG9uLCBUeXBlU2NyaXB0LCBSZWFjdCAmIFJlYWN0IE5hdGl2ZSwg0KLQsNGBdCwgR3JhcGhRTCwgQXBvbGxvINC4INC40L3RgtC10LPRgNCw0YbQuNGOINGBINCx0LvQvtC60YfQtdC50L3QvtC8IFRPTiDQuCBUZWxlZ3JhbSBNaW5pIEFwcF8xNzE0NzE1NDA4"
    //     : "https://subscribebot.org/api/v1/snippet/subscription/25500?cache_key=OTkwMF9BdXRvbWF0aW9uIGNvdXJzZfCfpJYgQm90TW90aGVyX1dlIGludml0ZSB5b3UgdG8gZGl2ZSBpbnRvIHByb2dyYW1taW5nIHVuZGVyIHRoZSBndWlkYW5jZSBvZiBuZXVyYWwgYXNzaXN0YW50cy4gWW91IHdpbGwgbGVhcm4gSmF2YVNjcmlwdCwgUHl0aG9uLCBUeXBlU2NyaXB0LCBSZWFjdCAmIFJlYWN0IE5hdGl2ZSwgVGHRgXQsIEdyYXBoUUwsIEFwb2xsbyBhbmQgaW50ZWdyYXRpb24gd2l0aCB0aGUgVE9OIGJsb2NrY2hhaW4gYW5kIFRlbGVncmFtIE1pbmkgQXBwXzE3MTQ3MTUzNjQ=",
    //   {
    //     caption: messageText,
    //     parse_mode: "HTML",
    //     reply_markup: {
    //       inline_keyboard: [
    //         [{
    //           text: "Подписаться",
    //           url: isRu
    //             ? "https://t.me/tribute/app?startapp=s5bT"
    //             : "https://t.me/tribute/app?startapp=s6Di",
    //         }],
    //       ],
    //     },
    //   },
    // );
    console.log("isSubscription false !!")
    const messageText = isRu
    ? `Чтобы пользоваться нашими ботами, вы должны подписаться на нашу группу в Telegram.`
    : `To use our bots, you must subscribe to our Telegram group.`;
    await ctx.replyWithVideo(videoUrl, {
      caption: messageText,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Subscribe", url: "https://t.me/ninenineninekingdom" }],
        ],
      },
    });
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
        ]],
      },
    },
  );
  return;
};

typeScriptDevBot.command("bots", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  const isRu = ctx.from?.language_code === "ru";
  await botLinks(ctx, isRu);
  return;
});

typeScriptDevBot.on("message:text", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  console.log(ctx);
  const query = ctx.message.text;

  try {
    const feedback = await getAiFeedbackFromSupabase({
      id_array: [],
      username: ctx.from?.username || "",
      language_code: ctx.from?.language_code || "",
      query,
    });
    await ctx.reply(feedback.ai_content, { parse_mode: "Markdown" });
    return;
  } catch (error) {
    console.error("Ошибка при получении ответа AI:", error);
    throw error;
  }
});

typeScriptDevBot.on("callback_query:data", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  console.log(ctx);
  const callbackData = ctx.callbackQuery.data;
  const isHaveAnswer = callbackData.split("_").length === 4;
  const isRu = ctx.from?.language_code === "ru";

  await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });

  if (callbackData === "start_test") {
    try {
      await resetProgress({
        username: ctx.callbackQuery.from.username || "",
        language: "typescript",
      });
      const questionContext = {
        lesson_number: 1,
        subtopic: 1,
      };

      const questions = await getQuestion({
        ctx: questionContext,
        language: "typescript",
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
        const topic = isRu ? ruTopic : enTopic;
        const allAnswers = await getCorrects({
          user_id: user_id.toString(),
          language: "all",
        });
        // Формируем сообщение
        const messageText =
          `${topic}\n\n<i><u>Теперь мы предлагаем вам закрепить полученные знания.</u></i>\n\n<b>Total: ${allAnswers} $IGLA</b>`;

        // Формируем кнопки
        const inlineKeyboard = [
          [{
            text: "Перейти к вопросу",
            callback_data: `typescript_01_01`,
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
        await ctx.reply("Вопросы не найдены.");
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
          isRu
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
        variant_0: enVariant_0,
        variant_1: enVariant_1,
        variant_2: enVariant_2,
        id,
        image_lesson_url,
      } = questions[0];

      const question = isRu ? ruQuestion : enQuestion;
      const variant_0 = isRu ? ruVariant_0 : enVariant_0;
      const variant_1 = isRu ? ruVariant_1 : enVariant_1;
      const variant_2 = isRu ? ruVariant_2 : enVariant_2;

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
        `<b>Вопрос №${id}</b>\n\n${question}\n\n<b> Total: ${allAnswers} $IGLA</b>`;

      // Формируем кнопки
      const inlineKeyboard = [
        [{
          text: variant_0 || "Вариант 1",
          callback_data: `${callbackData}_0`,
        }],
        [{
          text: variant_1 || "Вариант 2",
          callback_data: `${callbackData}_1`,
        }],
        [{
          text: variant_2 || "Не знаю",
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
        } = questions[0];

        const user_id = await getUid(ctx.callbackQuery.from.username || "");
        if (!user_id) {
          await ctx.reply("Пользователь не найден.");
          return;
        }

        const path = `${language}_${lesson_number}_${subtopic}`;
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
        const newPath = await pathIncrement({
          path,
          isSubtopic: biggestSubtopic === subtopic ? false : true,
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
                isRu
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
                isRu
                  ? `<b>🥲 Вы не прошли основной тест, но это не помешает вам развиваться! </b>\n\n Total: ${allAnswers} $IGLA`
                  : `<b>🥲 You didn't pass the main test, but that won't stop you from developing!</b>\n\n Total: ${allAnswers} $IGLA`,
                { parse_mode: "HTML" },
              );
            }
          }
          const [newLanguage, newLesson, newSubtopic] = newPath.split("_");
          const getQuestionContext = {
            lesson_number: Number(newLesson),
            subtopic: Number(newSubtopic),
          };
          const newQuestions = await getQuestion({
            ctx: getQuestionContext,
            language,
          });
          const { topic: ruTopic, image_lesson_url, topic_en: enTopic } =
            newQuestions[0];
          const topic = isRu ? ruTopic : enTopic;
          // Формируем сообщение
          const messageText =
            `${topic}\n\n<i><u>Теперь мы предлагаем вам закрепить полученные знания.</u></i>\n\n<b> Total: ${allAnswers} $IGLA</b>`;

          // Формируем кнопки
          const inlineKeyboard = [
            [{
              text: "Перейти к вопросу",
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
          await ctx.reply(isRu ? "Вопросы не найдены." : "No questions found.");
        }
      } else {
        console.error("Invalid callback(289)");
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }
});

typeScriptDevBot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    if (e.description.includes("bot was blocked by the user")) {
      throw new Error(`Bot was blocked by the user ${ctx.from?.username}`);
    } else {
      throw new Error(e.description);
    }
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
    const { content, tasks, data } = await handleUpdateTypeScript(req);
    return new Response(JSON.stringify({ content, tasks, data }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
  }
  return new Response("Endpoint not found", { status: 404 });
});
