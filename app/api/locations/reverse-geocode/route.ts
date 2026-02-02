import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const latStr = searchParams.get("lat");
        const lonStr = searchParams.get("lon");

        if (!latStr || !lonStr) {
            return NextResponse.json(
                { error: "Latitude and longitude required" },
                { status: 400 }
            );
        }

        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        const range = 0.05; // ~5.5km radius approx

        const supabase = await createClient();

        // Naive search: find cities within a square box
        // Ideally use PostGIS: st_dwithin(location, st_point(lon, lat), distance)
        const { data: cities, error } = await supabase
            .from("cities")
            .select("*")
            .gte('latitude', lat - range)
            .lte('latitude', lat + range)
            .gte('longitude', lon - range)
            .lte('longitude', lon + range)
            .limit(10);

        if (error) {
            console.error("Error reverse geocoding:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!cities || cities.length === 0) {
            return NextResponse.json(
                { success: false, error: "No location found nearby" },
                { status: 404 }
            );
        }

        // Client-side closest calculation
        const citiesList = cities as any[];
        const closest: any = citiesList.reduce((prev: any, curr: any) => {
            const prevDist = Math.sqrt(
                Math.pow(prev.latitude - lat, 2) + Math.pow(prev.longitude - lon, 2)
            );
            const currDist = Math.sqrt(
                Math.pow(curr.latitude - lat, 2) + Math.pow(curr.longitude - lon, 2)
            );
            return currDist < prevDist ? curr : prev;
        });

        // 2. Fetch State manually
        const { data: rawStateData, error: stateError } = await supabase
            .from("states")
            .select("*")
            .eq("id", closest.state_id)
            .single();

        const stateData = rawStateData as any;

        if (stateError) {
            console.error("Error fetching state:", stateError);
            // Return just the city if state lookup fails, or handle gracefully
        }

        // 3. Fetch Country manually
        let countryData = null;
        if (stateData && stateData.country_id) {
            const { data: cData } = await supabase
                .from("countries")
                .select("*")
                .eq("id", stateData.country_id)
                .single();
            countryData = cData;
        } else if (closest.country_id) {
            // Fallback if city has country_id directly
            const { data: cData } = await supabase
                .from("countries")
                .select("*")
                .eq("id", closest.country_id)
                .single();
            countryData = cData;
        }

        // Format matches what location-selector.tsx expects
        return NextResponse.json({
            success: true,
            country: countryData,
            state: stateData,
            city: {
                id: closest.id,
                name: closest.name,
                latitude: closest.latitude,
                longitude: closest.longitude
            }
        });

    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
