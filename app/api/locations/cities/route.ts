import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stateId = searchParams.get("stateId");
        const limit = parseInt(searchParams.get("limit") || "500");

        if (!stateId) {
            return NextResponse.json(
                { error: "State ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Convert stateId to number
        const stateIdNum = parseInt(stateId);

        const { data: cities, error } = await supabase
            .from("cities")
            .select("*")
            .eq("state_id", stateIdNum)
            .limit(limit)
            .order("name");

        if (error) {
            console.error("Error fetching cities:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ cities });
    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
