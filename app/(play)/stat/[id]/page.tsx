import StatisticsPage from "./component/main";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return generateMeta({
        title: "Statistics",
        description:
            "Statistics for the game",
        canonical: "/stat/" + params.id
    });
}

export default function StatPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <StatisticsPage params={params} />
    );
}