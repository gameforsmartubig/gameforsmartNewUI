import { use } from "react";
import Play from "./component/play";

export default function page(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  return <Play sessionId={params.id} />;
}
