import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parameter untuk pagination dan filtering
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100"); // Default 100 users for world map
    const bounds = searchParams.get("bounds"); // Format: "north,south,east,west"
    const zoom = parseInt(searchParams.get("zoom") || "2");
    const countryIso2 = searchParams.get("country"); // Filter by country iso2 code
    const search = searchParams.get("search"); // Search term
    
    // Hitung offset untuk pagination
    const offset = (page - 1) * limit;
    
    // Query profiles with location data from cities, states, countries
    // Latitude/longitude diambil dari tabel lokasi (prioritas: city > state > country)
    let query = supabase
      .from("profiles")
      .select(`
        id, 
        username, 
        fullname, 
        avatar_url, 
        country_id, 
        state_id, 
        city_id,
        countries (iso2, name, latitude, longitude), 
        states (name, latitude, longitude), 
        cities (name, latitude, longitude)
      `)
      .or("country_id.not.is.null,state_id.not.is.null,city_id.not.is.null");
    
    // Filter by country iso2 if specified
    if (countryIso2 && countryIso2 !== "all") {
      query = query.not("country_id", "is", null);
    }
    
    // Filter by search term if specified
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(`username.ilike.%${searchTerm}%,fullname.ilike.%${searchTerm}%`);
    }
    
    // Untuk zoom level rendah, kurangi density dengan sampling untuk performa optimal
    let effectiveLimit = limit;
    if (zoom <= 3) {
      effectiveLimit = Math.min(limit, 50);
    } else if (zoom <= 5) {
      effectiveLimit = Math.min(limit, 100);
    } else if (zoom <= 8) {
      effectiveLimit = Math.min(limit, 150);
    }
    
    // Tambahkan pagination
    query = query.range(offset, offset + effectiveLimit - 1);
    
    // Urutkan berdasarkan created_at terbaru untuk konsistensi
    query = query.order("created_at", { ascending: false });
    
    const { data: rawUsers, error } = await query;
    
    if (error) {
      console.error("Error fetching users with locations:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
    
    // Process users to get latitude/longitude from location hierarchy
    // Priority: city > state > country
    const users = (rawUsers || []).map((user: any) => {
      let latitude: number | null = null;
      let longitude: number | null = null;
      
      // Priority: city > state > country
      if (user.cities?.latitude && user.cities?.longitude) {
        latitude = user.cities.latitude;
        longitude = user.cities.longitude;
      } else if (user.states?.latitude && user.states?.longitude) {
        latitude = user.states.latitude;
        longitude = user.states.longitude;
      } else if (user.countries?.latitude && user.countries?.longitude) {
        latitude = user.countries.latitude;
        longitude = user.countries.longitude;
      }
      
      return {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        avatar_url: user.avatar_url,
        country_id: user.country_id,
        countries: user.countries,
        latitude,
        longitude
      };
    }).filter((user: any) => user.latitude !== null && user.longitude !== null);
    
    // Filter by country iso2 after processing (since we can't filter by nested field directly)
    let filteredUsers = users;
    if (countryIso2 && countryIso2 !== "all") {
      filteredUsers = users.filter((user: any) => 
        user.countries?.iso2?.toLowerCase() === countryIso2.toLowerCase()
      );
    }
    
    // Filter by bounds if specified
    if (bounds) {
      const [north, south, east, west] = bounds.split(",").map(Number);
      filteredUsers = filteredUsers.filter((user: any) => 
        user.latitude >= south &&
        user.latitude <= north &&
        user.longitude >= west &&
        user.longitude <= east
      );
    }
    
    // Count query for pagination
    let countQuery = supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or("country_id.not.is.null,state_id.not.is.null,city_id.not.is.null");
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      countQuery = countQuery.or(`username.ilike.%${searchTerm}%,fullname.ilike.%${searchTerm}%`);
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error("Error counting users:", countError);
    }
    
    return NextResponse.json({ 
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error in users/locations API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 