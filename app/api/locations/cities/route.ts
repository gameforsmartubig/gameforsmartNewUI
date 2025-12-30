import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get("stateId");
    const countryId = searchParams.get("countryId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabase
      .from("cities")
      .select("id, name, state_id, state_code, country_id, country_code, latitude, longitude, translations")
      .order("name", { ascending: true });

    if (stateId) {
      query = query.eq("state_id", parseInt(stateId));
    } else if (countryId) {
      query = query.eq("country_id", parseInt(countryId));
    } else {
      return NextResponse.json({ error: "stateId or countryId is required" }, { status: 400 });
    }

    if (search && search.trim().length >= 2) {
      query = query.ilike("name", `%${search}%`);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching cities:", error);
      return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
    }

    return NextResponse.json({ cities: data || [] });
  } catch (error) {
    console.error("Error in cities API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
