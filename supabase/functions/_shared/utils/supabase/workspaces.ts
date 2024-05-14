import { corsHeaders } from "../../corsHeaders.ts";
import { WorkspaceNode } from "../types/index.ts";
import { supabase } from "./index.ts";

export async function getWorkspaceById(
  workspace_id: string,
): Promise<WorkspaceNode[] | Response> {
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
    return new Response(
      JSON.stringify({ message: "Error getWorkspaceById: " + error }),
      {
        status: 500,
        headers: { ...corsHeaders },
      },
    );
  }
}

export async function getWorkspaceByName(
  name: string,
): Promise<WorkspaceNode[] | Response> {
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
    console.error(error, "error getWorkspaceByName");
    return new Response(
      JSON.stringify({ message: "Error getWorkspaceByName: " + error }),
      {
        status: 500,
        headers: { ...corsHeaders },
      },
    );
  }
}

export async function setMyWorkspace(
  user_id: string,
): Promise<WorkspaceNode[] | Response> {
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
    console.error(error, "error setMyWorkspace");
    return new Response(
      JSON.stringify({ message: "Error setMyWorkspace: " + error }),
      {
        status: 500,
        headers: { ...corsHeaders },
      },
    );
  }
}
