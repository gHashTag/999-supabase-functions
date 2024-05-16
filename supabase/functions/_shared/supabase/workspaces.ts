import { WorkspaceNode } from "../types/index.ts";
import { supabase } from "./index.ts";

export async function getWorkspaceById(
  workspace_id: string,
): Promise<WorkspaceNode[]> {
  try {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("workspace_id", workspace_id);
    console.log(error, "error");
    if (error) {
      throw new Error(error.message);
    }
    return data as WorkspaceNode[];
  } catch (error) {
    console.error(error, "error getWorkspaceById");
    throw new Error(error.message);
  }
}

export async function getWorkspaceByName(
  name: string,
): Promise<WorkspaceNode[]> {
  try {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("name", name);
    console.log(error, "error");
    if (error) {
      throw new Error(error.message);
    }
    return data as WorkspaceNode[];
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function setMyWorkspace(
  user_id: string,
): Promise<WorkspaceNode[]> {
  try {
    const { data, error } = await supabase.from("workspaces").insert([
      {
        title: "Fire",
        user_id,
      },
    ]);
    console.log(error, "setMyWorkspace error:::");
    if (error) {
      throw new Error(error.message);
    }
    if (data === null) {
      throw new Error("No data returned from insert");
    }
    return data as WorkspaceNode[];
  } catch (error) {
    throw new Error(error.message);
  }
}
