import Join from "./component/join";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Join",
    description:
      "Join the game",
    canonical: "/join"
  });
}

export default function Page() {
    return (
        <Join />
    );
}