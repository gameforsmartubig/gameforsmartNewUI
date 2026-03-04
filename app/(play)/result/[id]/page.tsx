import Leaderboard from "./component/leaderboard";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return generateMeta({
    title: "Leaderboard",
    description:
      "Leaderboard for the game",
    canonical: "/result/" + params.id
  });
}

export default function page(){
    return(
        <Leaderboard/>
    );
}