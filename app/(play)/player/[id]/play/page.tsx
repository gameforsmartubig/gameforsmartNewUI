import { use } from "react";
import Play from "./component/play";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return generateMeta({
    title: "Player play",
    description:
      "Play the game",
    canonical: "/player/" + params.id + "/play"
  });
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  return <Play sessionId={params.id} />;
}
