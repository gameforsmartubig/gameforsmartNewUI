import { Settings } from "./component";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return generateMeta({
    title: "Host Settings",
    description:
      "Settings for the game",
    canonical: "/host/" + params.id + "/settings"
  });
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Settings params={params} />;
}
