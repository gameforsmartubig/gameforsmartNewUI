import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("countries")
      .select("id, name, iso2, iso3, emoji, latitude, longitude, translations")
      .order("name", { ascending: true });

    if (search && search.trim().length >= 2) {
      query = query.or(`name.ilike.%${search}%,iso2.ilike.%${search}%,iso3.ilike.%${search}%`);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching countries:", error);
      return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
    }

    return NextResponse.json({ countries: data || [] });
  } catch (error) {
    console.error("Error in countries API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
