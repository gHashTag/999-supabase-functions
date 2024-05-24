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

// Test for get User Passport Table
const testUserPassport = async () => {
  // Test a simple query to the database
  const { data: table_data, error: table_error } = await supabase
    .from("user_passport")
    .select("*")
    .limit(1);

  if (table_error) {
    throw new Error("Error User Passport: " + table_error.message);
  }
  assert(table_data, "Data should be returned from the query.");
};
Deno.test("User Passport Table Test", testUserPassport);

// Test for get Tasks Table
const testTasks = async () => {
  // Test a simple query to the database
  const { data: table_data, error: table_error } = await supabase
    .from("tasks")
    .select("*")
    .limit(1);

  if (table_error) {
    throw new Error("Error Tasks: " + table_error.message);
  }
  assert(table_data, "Data should be returned from the query.");
};
Deno.test("Task Table Test", testTasks);

// Test for get Rooms Table
const testRooms = async () => {
  // Test a simple query to the database
  const { data: table_data, error: table_error } = await supabase
    .from("rooms")
    .select("*")
    .limit(1);

  if (table_error) {
    throw new Error("Error Rooms: " + table_error.message);
  }
  assert(table_data, "Data should be returned from the query.");
};
Deno.test("Rooms Table Test", testRooms);

// Test for get Room Assets Table
const testRoomAssets = async () => {
  // Test a simple query to the database
  const { data: table_data, error: table_error } = await supabase
    .from("room_assets")
    .select("*")
    .limit(1);

  if (table_error) {
    throw new Error("Error Room Assets: " + table_error.message);
  }
  assert(table_data, "Data should be returned from the query.");
};
Deno.test("Room Assets Table Test", testRoomAssets);

// Test for get Workspaces Table
const testWorkspaces = async () => {
  // Test a simple query to the database
  const { data: table_data, error: table_error } = await supabase
    .from("workspaces")
    .select("*")
    .limit(1);

  if (table_error) {
    throw new Error("Error Workspaces: " + table_error.message);
  }
  assert(table_data, "Data should be returned from the query.");
};
Deno.test("Workspaces Table Test", testWorkspaces);

// Test for get Messages Table
const testMessages = async () => {
  // Test a simple query to the database
  const { data: table_data, error: table_error } = await supabase
    .from("messages")
    .select("*")
    .limit(1);

  if (table_error) {
    throw new Error("Error Messages: " + table_error.message);
  }
  assert(table_data, "Data should be returned from the query.");
};
Deno.test("Messages Table Test", testMessages);
