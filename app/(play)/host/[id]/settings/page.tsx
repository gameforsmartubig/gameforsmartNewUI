import { Settings } from "./component";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Settings params={params} />;
}
