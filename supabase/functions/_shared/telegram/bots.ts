import {
  Bot,
  Context,
  SessionFlavor,
  webhookCallback,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";

// import {
//   I18n,
//   I18nFlavor,
// } from "https://deno.land/x/grammy_i18n@v1.0.2/mod.ts";
import { DEV } from "../constants.ts";

// // Bot Init
// export const botAiKoshey = new Bot<MyContext>(
//   Deno.env.get("TELEGRAM_BOT_TOKEN_AI_KOSHEY") || "",
// );

export type AiKosheyContext = Context & SessionFlavor<SessionData>;

export const javaScriptDevBot = new Bot<Context>(
  Deno.env.get("TELEGRAM_BOT_JAVASCRIPT_DEV_TOKEN") || "",
);
export const typeScriptDevBot = new Bot<Context>(
  Deno.env.get("TELEGRAM_BOT_TYPESCRIPT_DEV_TOKEN") || "",
);
export const reactNativeDevBot = new Bot<Context>(
  Deno.env.get("TELEGRAM_BOT_REACT_DEV_TOKEN") || "",
);
export const pythonDevBot = new Bot<Context>(
  Deno.env.get("TELEGRA_BOT_PYTHON_DEV_TOKEN") || "",
);

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

if (!Deno.env.get("SUPPORT_CHAT_ID")) {
  throw new Error("SUPPORT_CHAT_ID is not set");
}

if (!Deno.env.get("TELEGRAM_BOT_TOKEN_LOG")) {
  throw new Error("TELEGRAM_BOT_TOKEN_LOG is not set");
}
if (!Deno.env.get("AI_BABA_YAGA_CHAT_ID")) {
  throw new Error("AI_BABA_YAGA_CHAT_ID is not set");
}

if (!Deno.env.get("TELEGRAM_BOT_BUG_CATCHER_DEV")) {
  throw new Error("TELEGRAM_BOT_BUG_CATCHER_DEV is not set");
}

export const bugCatcherDevBotToken = Deno.env.get(
  "TELEGRAM_BOT_BUG_CATCHER_DEV",
);

export const aiKosheyUrl = Deno.env.get("AI_KOSHEY_URL");
export const aiKosheyFlowiseToken = Deno.env.get("AI_KOSHEY_FLOWISE_TOKEN");

const tokenProd = Deno.env.get("TELEGRAM_BOT_TOKEN_AI_KOSHEY");
const tokenTest = Deno.env.get("TELEGRAM_BOT_TOKEN_AI_KOSHEY_TEST");
export const supportChatId = Deno.env.get("SUPPORT_CHAT_ID");
export const logBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN_LOG");

console.log(DEV,'DEV')
export const botUsername = DEV ? "dao999nft_dev_bot" : "ai_koshey_bot";
console.log(botUsername, 'botUsername')

const token = DEV ? tokenTest : tokenProd;

interface SessionData {
  id?: string;
  session?: string;
}

interface Message {
  id?: number;
  role: string;
  content: string;
  user_id: string;
  session_id: string;
}

export const botAiKoshey = new Bot<AiKosheyContext>(token || "");

export const logBot = new Bot(logBotToken || "");
export const bugCatcherDevBot = new Bot(bugCatcherDevBotToken || "");
export const babaYagaChatId = Deno.env.get("AI_BABA_YAGA_CHAT_ID");

export const bugCatcherRequest = async (title: string, error: any) => {
  try {
    if (babaYagaChatId) {
      await bugCatcherDevBot.api.sendMessage(
        babaYagaChatId,
        `👾 ${title}\n\n${JSON.stringify(error)}`,
      );
      throw new Error(`👾 ${title}\n\n${JSON.stringify(error)}`);
    }
  } catch (error) {
    throw new Error(`👾 ${title}\n\n${JSON.stringify(error)}`);
  }
};

export const supportRequest = async (title: string, data: any) => {
  try {
    if (supportChatId) {
      await logBot.api.sendMessage(
        supportChatId,
        `🚀 ${title}\n\n${JSON.stringify(data)}`,
      );
    }
  } catch (error) {
    throw new Error(`Error supportRequest: ${JSON.stringify(error)}`);
  }
};

// handleUpdate
export const handleUpdateAiKoshey = webhookCallback(botAiKoshey, "std/http");

export const handleUpdateJavaScript = webhookCallback(
  javaScriptDevBot,
  "std/http",
);
export const handleUpdateTypeScript = webhookCallback(
  typeScriptDevBot,
  "std/http",
);
export const handleUpdateReactNative = webhookCallback(
  reactNativeDevBot,
  "std/http",
);
export const handleUpdatePython = webhookCallback(pythonDevBot, "std/http");

// // i18n
// export const i18n = new I18n<MyContext>({
//     defaultLocale: "en", // see below for more information
//     // Load all translation files from locales/. (Not working in Deno Deploy.)
//     directory: "locales",
//     globalTranslationContext(ctx) {
//         return { name: ctx.from?.first_name ?? "" };
//       },
//   });
//   bot.use(i18n)
//   javaScriptDevBot.use(i18n)
//   typeScriptDevBot.use(i18n)
//   reactNativeDevBot.use(i18n)
//   pythonDevBot.use(i18n)
