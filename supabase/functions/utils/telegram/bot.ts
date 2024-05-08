import { Bot, webhookCallback, Context } from "https://deno.land/x/grammy@v1.22.4/mod.ts";
import { I18n, I18nFlavor } from "https://deno.land/x/grammy_i18n@v1.0.2/mod.ts";

// Bot Context
type MyContext = Context & I18nFlavor;

// Bot Init
export const bot = new Bot<MyContext>(Deno.env.get("TELEGRAM_BOT_TOKEN") || "");
export const javaScriptDevBot = new Bot<MyContext>(Deno.env.get("TELEGRAM_BOT_JAVASCRIPT_DEV_TOKEN") || "");
export const typeScriptDevBot = new Bot<MyContext>(Deno.env.get("TELEGRAM_BOT_TYPESCRIPT_DEV_TOKEN") || "")
export const reactNativeDevBot = new Bot<MyContext>(Deno.env.get("TELEGRAM_BOT_REACT_DEV_TOKEN") || "")
export const pythonDevBot = new Bot<MyContext>(Deno.env.get("TELEGRA_BOT_PYTHON_DEV_TOKEN") || "")

// handleUpdate
export const handleUpdate = webhookCallback(bot, "std/http");
export const handleUpdateJavaScript = webhookCallback(javaScriptDevBot, "std/http");
export const handleUpdateTypeScript = webhookCallback(typeScriptDevBot, "std/http");
export const handleUpdateReactNative = webhookCallback(reactNativeDevBot, "std/http");
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