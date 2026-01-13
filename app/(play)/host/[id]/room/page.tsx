import { use } from "react";
import WaitingRoom from "./component/waitingroom";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <WaitingRoom sessionId={resolvedParams.id} />;
}
