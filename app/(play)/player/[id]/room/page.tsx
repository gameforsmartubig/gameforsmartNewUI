import { use } from "react";
import WaitingRoom from "./component/waitingroom";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return generateMeta({
    title: "Player room",
    description:
      "Waiting room for the game",
    canonical: "/player/" + params.id + "/room"
  });
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <WaitingRoom sessionId={resolvedParams.id} />;
}
