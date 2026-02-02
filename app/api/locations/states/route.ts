import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const countryId = searchParams.get("countryId");
        const limit = parseInt(searchParams.get("limit") || "500");

        if (!countryId) {
            return NextResponse.json(
                { error: "Country ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Convert countryId to number since schema usually uses integer
        const countryIdNum = parseInt(countryId);

        const { data: states, error } = await supabase
            .from("states")
            .select("*")
            .eq("country_id", countryIdNum)
            .limit(limit)
            .order("name");

        if (error) {
            console.error("Error fetching states:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ states });
    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
