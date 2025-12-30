import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: "Invalid lat/lon values" }, { status: 400 });
    }

    // Call Nominatim API for reverse geocoding
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en&addressdetails=1`,
      {
        headers: {
          "User-Agent": "GameForSmart/1.0",
        },
      }
    );

    if (!nominatimResponse.ok) {
      throw new Error("Failed to fetch location data from Nominatim");
    }

    const nominatimData = await nominatimResponse.json();
    const address = nominatimData.address || {};

    // Extract location info from Nominatim response
    const countryCode = address.country_code?.toUpperCase();
    const stateName = address.state || address.region || address.province || "";
    const cityName = address.city || address.town || address.village || address.municipality || address.county || "";

    if (!countryCode) {
      return NextResponse.json({ error: "Could not determine country from coordinates" }, { status: 404 });
    }

    // Find country in database
    const { data: countryData, error: countryError } = await supabase
      .from("countries")
      .select("id, name, iso2, emoji, latitude, longitude")
      .ilike("iso2", countryCode)
      .single();

    if (countryError || !countryData) {
      return NextResponse.json({ error: "Country not found in database" }, { status: 404 });
    }

    let result: {
      country: typeof countryData;
      state: { id: number; name: string; latitude: number; longitude: number } | null;
      city: { id: number; name: string; latitude: number; longitude: number } | null;
    } = {
      country: countryData,
      state: null,
      city: null,
    };

    // Find state in database if available
    if (stateName) {
      const { data: stateData } = await supabase
        .from("states")
        .select("id, name, latitude, longitude")
        .eq("country_id", countryData.id)
        .ilike("name", `%${stateName}%`)
        .limit(1)
        .single();

      if (stateData) {
        result.state = stateData;

        // Find city in database if available
        if (cityName) {
          const { data: cityData } = await supabase
            .from("cities")
            .select("id, name, latitude, longitude")
            .eq("state_id", stateData.id)
            .ilike("name", `%${cityName}%`)
            .limit(1)
            .single();

          if (cityData) {
            result.city = cityData;
          } else {
            // Try to find city by country if not found in state
            const { data: cityByCountry } = await supabase
              .from("cities")
              .select("id, name, state_id, latitude, longitude")
              .eq("country_id", countryData.id)
              .ilike("name", `%${cityName}%`)
              .limit(1)
              .single();

            if (cityByCountry) {
              result.city = cityByCountry;
              // Also get the state for this city if different
              if (cityByCountry.state_id && cityByCountry.state_id !== stateData.id) {
                const { data: correctState } = await supabase
                  .from("states")
                  .select("id, name, latitude, longitude")
                  .eq("id", cityByCountry.state_id)
                  .single();
                if (correctState) {
                  result.state = correctState;
                }
              }
            }
          }
        }
      } else {
        // If state not found, try to find city directly by country
        if (cityName) {
          const { data: cityData } = await supabase
            .from("cities")
            .select("id, name, state_id, latitude, longitude")
            .eq("country_id", countryData.id)
            .ilike("name", `%${cityName}%`)
            .limit(1)
            .single();

          if (cityData) {
            result.city = cityData;
            // Get the state for this city
            if (cityData.state_id) {
              const { data: stateForCity } = await supabase
                .from("states")
                .select("id, name, latitude, longitude")
                .eq("id", cityData.state_id)
                .single();
              if (stateForCity) {
                result.state = stateForCity;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      nominatimAddress: address,
      ...result,
    });
  } catch (error) {
    console.error("Error in reverse geocode API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
