import {
  createUser,
  getBiggest,
  getCorrects,
  getLastCallback,
  getQuestion,
  getUid,
  resetProgress,
  updateProgress,
  updateResult,
} from "../_shared/utils/supabase.ts";
import { pathIncrement } from "../path-increment.ts";
import { getAiFeedback } from "../get-ai-feedback.ts";
import { checkSubscription } from "../check-subscription.ts";
import {
  handleUpdateReactNative,
  reactNativeDevBot,
} from "../_shared/utils/telegram/bots.ts";

reactNativeDevBot.command("start", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  createUser(ctx);
  const isSubscription = await checkSubscription(
    ctx,
    ctx.from?.id || 0,
    "-1001988802788",
  );
  const isRu = ctx.from?.language_code === "ru";

  if (isSubscription === true) {
    ctx.reply(
      isRu
        ? `🚀 Привет, ${ctx.from?.first_name}! \nДобро пожаловать в твоего персонального помощника по изучению языка программирования React Native с помощью искусственного интеллекта! Здесь ты сможешь не только освоить основы React Native, но и изучить более сложные темы через интерактивное обучение и общение.\n\n🖥️ Я здесь, чтобы предложить тебе обзор тем начального уровня, помочь решить задачи и пройти тестирование, а также ответить на любые вопросы по ходу твоего обучения. Наше общение будет строиться на основе последних достижений в области искусственного интеллекта, что сделает твой учебный процесс еще более эффективным и увлекательным.\n\n💡 Готов начать увлекательное путешествие в мир React Native? \nНачать тест(кнопка)`
        : `🚀 Hi, ${ctx.from?.first_name}! \nWelcome to your personal assistant to learn React Native programming language with artificial intelligence! Here you can not only learn the basics of React Native, but also explore more advanced topics through interactive learning and communication.\n\n🖥️ I'm here to offer you an overview of entry-level topics, help you solve problems and take tests, and answer any questions as you learn. Our communication will be based on the latest advances in artificial intelligence, making your learning experience even more effective and fun.\n\n\n💡 Ready to start your exciting journey into the world of React Native? \nStart Test(button)`,
      // ctx.t("startReactNative"),
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Начать тест!", callback_data: "start_test" }],
          ],
        },
      },
    );
  } else if (isSubscription === false) {
    const messageText = isRu
      ? `<b>Курс Автоматизация🤖 BotMother</b>\nПрограммирование под руководством нейронных помощников. Вы изучите JavaScript, Python, TypeScript, React & React Native, Тасt, GraphQL, Apollo и интеграцию с блокчейном TON и Telegram Mini App`
      : `<b>Automation Course🤖 BotMother</b>\nProgramming under the guidance of neural assistants. You will learn JavaScript, Python, TypeScript, React & React Native, TAST, GraphQL, Apollo and integration with the TON blockchain and Telegram Mini App`;
    await ctx.replyWithPhoto(
      isRu
        ? "https://subscribebot.org/api/v1/snippet/subscription/19957?cache_key=OTk5OTAwX9Ca0YPRgNGBINCQ0LLRgtC+0LzQsNGC0LjQt9Cw0YbQuNGP8J+kliBCb3RNb3RoZXJf0J/RgNC+0LPRgNCw0LzQvNC40YDQvtCy0LDQvdC40LUg0L/QvtC0INGA0YPQutC+0LLQvtC00YHRgtCy0L7QvCDQvdC10LnRgNC+0L3QvdGL0YUg0L/QvtC80L7RidC90LjQutC+0LIuINCS0Ysg0LjQt9GD0YfQuNGC0LUgSmF2YVNjcmlwdCwgUHl0aG9uLCBUeXBlU2NyaXB0LCBSZWFjdCAmIFJlYWN0IE5hdGl2ZSwg0KLQsNGBdCwgR3JhcGhRTCwgQXBvbGxvINC4INC40L3RgtC10LPRgNCw0YbQuNGOINGBINCx0LvQvtC60YfQtdC50L3QvtC8IFRPTiDQuCBUZWxlZ3JhbSBNaW5pIEFwcF8xNzE0NzE1NDA4"
        : "https://subscribebot.org/api/v1/snippet/subscription/25500?cache_key=OTkwMF9BdXRvbWF0aW9uIGNvdXJzZfCfpJYgQm90TW90aGVyX1dlIGludml0ZSB5b3UgdG8gZGl2ZSBpbnRvIHByb2dyYW1taW5nIHVuZGVyIHRoZSBndWlkYW5jZSBvZiBuZXVyYWwgYXNzaXN0YW50cy4gWW91IHdpbGwgbGVhcm4gSmF2YVNjcmlwdCwgUHl0aG9uLCBUeXBlU2NyaXB0LCBSZWFjdCAmIFJlYWN0IE5hdGl2ZSwgVGHRgXQsIEdyYXBoUUwsIEFwb2xsbyBhbmQgaW50ZWdyYXRpb24gd2l0aCB0aGUgVE9OIGJsb2NrY2hhaW4gYW5kIFRlbGVncmFtIE1pbmkgQXBwXzE3MTQ3MTUzNjQ=",
      {
        caption: messageText,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Подписаться",
              url: isRu
                ? "https://t.me/tribute/app?startapp=s5bT"
                : "https://t.me/tribute/app?startapp=s6Di",
            }],
          ],
        },
      },
    );
  }
});

reactNativeDevBot.on("message:text", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  console.log(ctx);
  const query = ctx.message.text;
  const endpoint =
    "https://flowiseai-railway-production-758e.up.railway.app/api/v1/prediction/46937ed0-41df-4c9c-80f9-f3056a1b81c9";
  const token = `${Deno.env.get("FLOWISE_AI_REACTNATIVE_DEV")}`;

  try {
    const feedback = await getAiFeedback({ query, endpoint, token });
    await ctx.reply(feedback, { parse_mode: "Markdown" });
    return;
  } catch (error) {
    console.error("Ошибка при получении ответа AI:", error);
  }
});

reactNativeDevBot.on("callback_query:data", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  console.log(ctx);
  const callbackData = ctx.callbackQuery.data;
  const isHaveAnswer = callbackData.split("_").length === 4;
  const isRu = ctx.from?.language_code === "ru";

  if (callbackData === "start_test") {
    try {
      resetProgress({
        username: ctx.callbackQuery.from.username || "",
        language: "reactnative",
      });
      const questionContext = {
        lesson_number: 1,
        subtopic: 1,
      };

      const questions = await getQuestion({
        ctx: questionContext,
        language: "reactnative",
      });
      if (questions.length > 0) {
        const {
          topic: ruTopic,
          image_lesson_url,
          topic_en: enTopic
        } = questions[0];

        const topic = isRu ? ruTopic : enTopic;
        // Формируем сообщение
        const messageText =
          `${topic}\n\n<i><u>Теперь мы предлагаем вам закрепить полученные знания.</u></i>\n\n<b> 0 $IGLA </b>`;

        // Формируем кнопки
        const inlineKeyboard = [
          [{
            text: "Перейти к вопросу",
            callback_data: `reactnative_01_01`,
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
        ctx.reply("Вопросы не найдены.");
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
      const correctAnswers = await getCorrects({ user_id, language });
      const allAnswers = await getCorrects({ user_id, language: "all" });
      // Формируем сообщение
      const messageText =
        `<b>Вопрос №${id}</b>\n\n${question}\n\n<b> ${correctAnswers} $IGLA\n Total: ${allAnswers} $IGLA</b>`;

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
          ctx.reply("✅");
        } else {
          isTrueAnswer = false;
          ctx.reply("❌");
        }
        await updateProgress({ user_id, isTrue: isTrueAnswer, language });
        const newPath = await pathIncrement({
          path,
          isSubtopic: biggestSubtopic === Number(subtopic) ? false : true,
        });
        const correctAnswers = await getCorrects({ user_id, language });
        const allAnswers = await getCorrects({ user_id, language: "all" });

        const lastCallbackContext = await getLastCallback(language);
        console.log(lastCallbackContext);
        if (lastCallbackContext) {
          const callbackResult =
            `${language}_${lastCallbackContext.lesson_number}_${lastCallbackContext.subtopic}`;
          if (newPath === callbackResult) {
            const correctProcent = correctAnswers * 0.8;
            if (correctProcent >= 80) {
              await updateResult({
                user_id,
                language,
                value: true,
              });
              ctx.reply(
                isRu
                  ? `<b>🥳 Поздравляем, вы прошли тест! </b>\n\n Ваш результат: ${correctAnswers} $IGLA\n Total: ${allAnswers} $IGLA`
                  : `<b>🥳 Congratulations, you passed the test!</b>\n\n Your result: ${correctAnswers} $IGLA\n Total: ${allAnswers} $IGLA`,
                { parse_mode: "HTML" },
              );
            } else {
              await updateResult({
                user_id,
                language,
                value: false,
              });
              ctx.reply(
                isRu
                  ? `<b>🥲 Вы не прошли тест, но это не помешает вам развиваться! </b>\n\n : ${correctAnswers} $IGLA.\n Total: ${allAnswers} $IGLA`
                  : `<b>🥲 You didn't pass the test, but that won't stop you from developing!</b>\n\n : ${correctAnswers} $IGLA.\n Total: ${allAnswers} $IGLA`,
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
          const { topic: ruTopic, image_lesson_url , topic_en: enTopic} = newQuestions[0];
          const topic = isRu ? ruTopic : enTopic;
          // Формируем сообщение
          const messageText =
            `${topic}\n\n<i><u>Теперь мы предлагаем вам закрепить полученные знания.</u></i>\n\n<b> ${correctAnswers} $IGLA\n Total: ${allAnswers}</b>`;

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
          ctx.reply(isRu ? "Вопросы не найдены." : "No questions found.");
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

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (
      url.searchParams.get("secret") !==
        Deno.env.get("FUNCTION_SECRET")
    ) {
      return new Response("not allowed", { status: 405 });
    }

    const result = await handleUpdateReactNative(req);
    if (!(result instanceof Response)) {
      console.error("handleUpdate не вернул объект Response", result);
      return new Response("Internal Server Error", { status: 500 });
    }
    return result;
  } catch (err) {
    console.error("Ошибка при обработке запроса:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
