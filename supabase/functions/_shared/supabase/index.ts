import { SupabaseClient, createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_URL_ANON_KEY,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  DEV
} from "../constants.ts";

// Prod
export const client = () => {
  const supabaseClient = createClient(
    SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY ?? "",
  );
  return supabaseClient;
};



export const supabase = client();


export const clientInvokeLocal = () => {
  const supabaseClient: SupabaseClient = createClient(
    LOCAL_SUPABASE_URL ?? "",
    LOCAL_SUPABASE_URL_ANON_KEY ?? "",
  );

  return supabaseClient;
};

export const clientInvokeProd = () => {
  const supabaseClient = createClient(
    SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY ?? "",
  );

  return supabaseClient;
};

export const supabaseInvokeProd= clientInvokeProd();

export const supabaseLocal = LOCAL_SUPABASE_URL && LOCAL_SUPABASE_URL_ANON_KEY ? clientInvokeLocal() : null;

export const supabaseInvoke = DEV ? supabaseLocal : supabaseInvokeProd;

// export function supabaseAdapter<T>(
//   { supabase, table }: { supabase: SupabaseClient; table: string },
// ) {
//   if (!supabase) {
//     throw new Error(
//       "Kindly pass an instance of supabase client to the parameter list.",
//     );
//   }

//   if (!table) {
//     throw new Error("Kindly pass a table to the parameter list.");
//   }

//   return {
//     read: async (id: string) => {
//       const { data, error } = await supabase.from(table).select("sessions").eq(
//         "id",
//         id,
//       ).single();

//       if (error || !data) {
//         return undefined;
//       }

//       return JSON.parse(data.sessions) as T;
//     },
//     write: async (id: string, value: T) => {
//       console.log("write", id, value);
//       const input = { session: JSON.stringify(value) };
//       try {
//         console.log(table, "table");
//         await supabase.from(table).upsert(input);
//       } catch (error) {
//         console.log(error, "write error");
//       }
//     },
//     delete: async (id: string) => {
//       await supabase.from(table).delete().match({ id });
//     },
//   };
// }

// export const supabaseStorage = supabaseAdapter({
//   supabase,
//   table: "sessions",
// });

// // Пример использования метода read
// export async function getSession(id: string) {
//   try {
//     const session = await supabaseStorage.read(id);
//     return session;
//   } catch (error) {
//     throw Error(`Error getSession: ${error}`);
//   }
// }

// // Пример использования метода write
// export async function saveSession(id: string, sessionData: any) {
//   try {
//     await supabaseStorage.write(id, sessionData);
//   } catch (error) {
//     throw Error(`Error saveSession: ${error}`);
//   }
// }

// // Пример использования метода delete
// export async function deleteSession(id: string) {
//   try {
//     await supabaseStorage.delete(id);
//     return true;
//   } catch (error) {
//     throw Error(`Error deleteSession: ${error}`);
//   }
// }
