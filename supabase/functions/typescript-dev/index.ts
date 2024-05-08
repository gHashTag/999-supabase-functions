import { createUser, getBiggest, getQuestion, getUid, resetProgress, getCorrects, updateProgress, updateResult, getLastCallback } from "../utils/supabase.ts";
import { pathIncrement } from "../path-increment.ts";
import { getAiFeedback } from "../get-ai-feedback.ts";
import { checkSubscription } from "../check-subscription.ts";
import { handleUpdateTypeScript, typeScriptDevBot } from "../utils/telegram/bot.ts";

typeScriptDevBot.command("start", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  createUser(ctx);
  const isSubscription = await checkSubscription(ctx, ctx.from?.id || 0, "-1001988802788")
  if ( isSubscription=== true ) {
  ctx.reply(
    `Hi, ${ctx.update.message?.from.first_name}! 🚀 Давай начнем с тестов – выбери один из них, чтобы проверить свои знания и подготовиться к захватывающему путешествию в мир программирования! 🖥️✨ `,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Начать тест!", callback_data: "start_test" }],
        ],
      },
    },
  );
} else if (isSubscription === false) {
  const messageText = `<b>Обучение программированию с ИИ</b>\nПогрузитесь в мир программирования вместе с нашими нейронными помощниками по JavaScript, TypeScript, React & React Native, GraphQL, Apollo и TON`
  await ctx.replyWithPhoto("https://subscribebot.org/api/v1/snippet/subscription/19957?cache_key=OTk5OTAwX9Ce0LHRg9GH0LXQvdC40LUg0L/RgNC+0LPRgNCw0LzQvNC40YDQvtCy0LDQvdC40Y4g0YEg0JjQmF/Qn9C+0LPRgNGD0LfQuNGC0LXRgdGMINCyINC80LjRgCDQv9GA0L7Qs9GA0LDQvNC80LjRgNC+0LLQsNC90LjRjyDQstC80LXRgdGC0LUg0YEg0L3QsNGI0LjQvNC4INC90LXQudGA0L7QvdC90YvQvNC4INC/0L7QvNC+0YnQvdC40LrQsNC80Lgg0L/QviBKYXZhU2NyaXB0LCBUeXBlU2NyaXB0LCBSZWFjdCAmIFJlYWN0IE5hdGl2ZSwgR3JhcGhRTCwgQXBvbGxvINC4IFRPTl8xNzE0NTQ3MTYw", {
    caption: messageText,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Подписаться", url: "https://t.me/tribute/app?startapp=s5bT" }]
      ]
    }
  });
}
});

typeScriptDevBot.on("message:text", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  console.log(ctx)
  const query = ctx.message.text;
  const endpoint = "https://flowiseai-railway-production-758e.up.railway.app/api/v1/prediction/46937ed0-41df-4c9c-80f9-f3056a1b81c9"
  const token = `${Deno.env.get("FLOWISE_AI_TYPESCRIPT_DEV")}`

  try {
    const feedback = await getAiFeedback({query, endpoint, token });
    await ctx.reply(feedback, { parse_mode: "Markdown" });
    return
  } catch (error) {
    console.error("Ошибка при получении ответа AI:", error);
  }
});

typeScriptDevBot.on("callback_query:data", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  console.log(ctx)
  const callbackData = ctx.callbackQuery.data;
  const isHaveAnswer = callbackData.split("_").length === 4;

  if (callbackData === "start_test") {
    try {
      resetProgress({username: ctx.callbackQuery.from.username || "", language: "typescript"});
      const questionContext = {
        lesson_number: 1,
        subtopic: 1,
      };

      const questions = await getQuestion({ctx: questionContext, language: "typescript"});
      if (questions.length > 0) {
        const {
          topic,
          image_lesson_url,
        } = questions[0];

        // Формируем сообщение
        const messageText =
          `${topic}\n\n<i><u>Теперь мы предлагаем вам закрепить полученные знания.</u></i>\n\n<b> 0 $IGLA </b>`;

        // Формируем кнопки
        const inlineKeyboard = [
          [{
            text: "Перейти к вопросу",
            callback_data: `typescript_01_01`,
          }],
        ];

        if(image_lesson_url) {
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
        })
        return
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
        const getQuestionContext = {lesson_number: Number(lesson),
          subtopic: Number(subtopic),}
        questions = await getQuestion({
          ctx: getQuestionContext, language
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
          "Одно из значений некорректно. Пожалуйста, проверьте данные.",
        );
        return;
      }
      const {
        question,
        variant_0,
        variant_1,
        variant_2,
        id,
        image_lesson_url
      } = questions[0];

      const user_id = await getUid(ctx.callbackQuery.from.username || "");
      if (!user_id) {
        await ctx.reply("Пользователь не найден.");
        return;
      }
      console.log(user_id)
      const correctAnswers = await getCorrects({user_id, language})
      const allAnswers = await getCorrects({user_id, language: "all"})
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

      if (image_lesson_url){
      // Отправляем сообщение
      await ctx.editMessageCaption({
        reply_markup: { inline_keyboard: inlineKeyboard },
        caption: messageText,
        parse_mode: "HTML",
      });} else {
        await ctx.editMessageText(messageText, { 
          reply_markup: { inline_keyboard: inlineKeyboard },
          parse_mode: "HTML",
        })
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

      const questions = await getQuestion({ctx: questionContext, language});
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
        const biggestSubtopic = await getBiggest({lesson_number: Number(lesson_number), language});

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
        const correctAnswers = await getCorrects({user_id, language})
        const allAnswers = await getCorrects({user_id, language: "all"})

        const lastCallbackContext = await getLastCallback(language)
        console.log(lastCallbackContext)
        if (lastCallbackContext){
        const callbackResult = `${language}_${lastCallbackContext.lesson_number}_${lastCallbackContext.subtopic}`
        if (newPath === callbackResult) {
          const correctProcent = correctAnswers * 0.8;
          if (correctProcent >= 80) {
            await updateResult({
              user_id,
              language,
              value: true,
            });
            ctx.reply(
              `<b>🥳 Поздравляем, вы прошли тест! </b>\n\n Ваш результат: ${correctAnswers} $IGLA\n Total: ${allAnswers} $IGLA`,
              { parse_mode: "HTML" },
            );
          } else {
            await updateResult({
              user_id,
              language,
              value: false,
            });
            ctx.reply(
              `<b>🥲 Вы не прошли тест, но это не помешает вам развиваться! </b>\n\n : ${correctAnswers} $IGLA.\n Total: ${allAnswers} $IGLA`,
              { parse_mode: "HTML" },
            );
          }
        }
        const [newLanguage, newLesson, newSubtopic] = newPath.split("_");
        const getQuestionContext = {
          lesson_number: Number(newLesson),
          subtopic: Number(newSubtopic),
        }
        const newQuestions = await getQuestion({ctx: getQuestionContext, language});
        const { topic, image_lesson_url } = newQuestions[0];
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
        if(image_lesson_url) {
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
          })
          return
        }
      } else {
        ctx.reply("Вопросы не найдены.");
      }}
      else {
        console.error("Invalid callback(289)")
        return
      }
    } catch (error) {
      console.error(error);
    }
  }
});

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== Deno.env.get("NEXT_PUBLIC_SUPABASE_FUNCTION_SECRET")) {
      return new Response("not allowed", { status: 405 });
    }

    const result = await handleUpdateTypeScript(req);
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