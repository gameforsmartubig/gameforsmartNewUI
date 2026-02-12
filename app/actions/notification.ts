"use server";

import { createClient } from "@/lib/supabase-server";

export async function createNotification(notification: any) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("notifications").insert(notification);

    if (error) {
      console.error("Supabase notification insert error:", error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}
