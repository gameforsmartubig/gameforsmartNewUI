import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get("countryId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!countryId) {
      return NextResponse.json({ error: "countryId is required" }, { status: 400 });
    }

    let query = supabase
      .from("states")
      .select("id, name, country_id, country_code, latitude, longitude, translations")
      .eq("country_id", parseInt(countryId))
      .order("name", { ascending: true });

    if (search && search.trim().length >= 2) {
      query = query.ilike("name", `%${search}%`);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching states:", error);
      return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 });
    }

    return NextResponse.json({ states: data || [] });
  } catch (error) {
    console.error("Error in states API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
