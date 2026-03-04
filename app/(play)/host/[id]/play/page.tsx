import { use } from "react";
import Play from "./component/play";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return generateMeta({
    title: "Host play",
    description:
      "Host the game",
    canonical: "/host/" + params.id + "/play"
  });
}

export default function page(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  return <Play sessionId={params.id} />;
}
