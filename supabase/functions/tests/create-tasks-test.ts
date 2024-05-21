// Import required libraries and modules
import { assert } from "https://deno.land/std@0.192.0/testing/asserts.ts";
// import { assert, assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { supabase } from "../_shared/supabase/index.ts";
//import { supabase, supabaseLocal } from "../_shared/supabase/index.ts";

// Test the creation and functionality of the Supabase client
const testClientCreation = async () => {
  // Test a simple query to the database
  const { data: table_data, error: table_error } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (table_error) {
    throw new Error("Invalid Supabase client: " + table_error.message);
  }
  assert(table_data, "Data should be returned from the query.");
};
Deno.test("Client Creation Test", testClientCreation);
