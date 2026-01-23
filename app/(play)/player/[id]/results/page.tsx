import { use } from "react";
import Results from "./component/results";

export default function Page(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  return <Results sessionId={params.id} />;
}
